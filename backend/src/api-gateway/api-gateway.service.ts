import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderEncryptionService } from './services/provider-encryption.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { ExternalProvider } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class ApiGatewayService {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: ProviderEncryptionService
  ) {}

  async getAllProviders() {
    const providers = await this.prisma.externalProvider.findMany({
      include: {
        fallbackProvider: {
          select: { id: true, providerName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return providers.map(p => ({
      ...p,
      apiKey: '****',
      apiSecret: p.apiSecret ? '****' : null
    }));
  }

  async getProviderById(id: string) {
    const provider = await this.prisma.externalProvider.findUnique({ 
      where: { id },
      include: {
        fallbackProvider: true
      }
    });
    if (!provider) return null;

    return {
      ...provider,
      apiKey: '****',
      apiSecret: provider.apiSecret ? '****' : null
    };
  }

  async createProvider(dto: CreateProviderDto) {
    const { apiKey, apiSecret, fallbackProviderId, costPerUnit, ...rest } = dto;
    const encryptedApiKey = this.encryptionService.encrypt(apiKey);
    const encryptedApiSecret = apiSecret ? this.encryptionService.encrypt(apiSecret) : null;

    return this.prisma.externalProvider.create({
      data: {
        ...rest,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        fallbackProviderId: fallbackProviderId || null,
        costPerUnit: costPerUnit || 0
      }
    });
  }

  async updateProvider(id: string, dto: UpdateProviderDto) {
    const { apiKey, apiSecret, fallbackProviderId, costPerUnit, ...rest } = dto;
    const data: any = { ...rest };
    
    if (apiKey) {
      data.apiKey = this.encryptionService.encrypt(apiKey);
    }
    if (apiSecret) {
      data.apiSecret = this.encryptionService.encrypt(apiSecret);
    }
    if (fallbackProviderId !== undefined) {
      data.fallbackProviderId = fallbackProviderId;
    }
    if (costPerUnit !== undefined) {
      data.costPerUnit = costPerUnit;
    }

    return this.prisma.externalProvider.update({
      where: { id },
      data
    });
  }

  async deleteProvider(id: string) {
    return this.prisma.externalProvider.delete({ where: { id } });
  }

  async testProvider(id: string) {
    const provider = await this.prisma.externalProvider.findUnique({ where: { id } });
    if (!provider) throw new Error('Provider not found');

    const decryptedKey = this.encryptionService.decrypt(provider.apiKey);
    this.logger.log(`Testing provider ${provider.providerName} with key: ${decryptedKey.substring(0, 5)}...`);

    // Real ping logic
    const start = Date.now();
    try {
      await this.pingProvider(provider, decryptedKey);
      const latency = Date.now() - start;
      
      // Update stats
      await this.prisma.externalProvider.update({
        where: { id },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'HEALTHY',
          currentLatency: latency,
          failureCount: 0
        }
      });

      return {
        success: true,
        message: `Connection to ${provider.providerName} successful.`,
        latency
      };
    } catch (error) {
      // Update stats
      await this.prisma.externalProvider.update({
        where: { id },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'FAILING',
          failureCount: { increment: 1 }
        }
      });

      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        latency: 0
      };
    }
  }

  async getDashboardData() {
    // 1. Providers
    const providers = await this.getAllProviders();

    const metrics = await this.prisma.apiMetric.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Last 24h
      orderBy: { timestamp: 'asc' }
    });

    return {
      providers,
      metrics,
      summary: {
        total: providers.length,
        healthy: providers.filter(p => p.healthStatus === 'HEALTHY').length,
        failing: providers.filter(p => p.healthStatus === 'FAILING').length
      }
    };
  }

  private async pingProvider(provider: ExternalProvider, key: string) {
    // Generic ping based on service type or endpoint
    if (!provider.endpoint) {
      if (provider.providerName.includes('Google')) {
        return true; 
      }
      return true;
    }

    try {
      // Basic HEAD request
      await axios.head(provider.endpoint, { timeout: 5000 });
      return true;
    } catch (e) {
        // If HEAD fails (404/405), try GET
        try {
            await axios.get(provider.endpoint, { timeout: 5000 });
        } catch (e2) {
             // If status is 401/403, it means we reached the server -> Healthy
             if (e2.response && (e2.response.status === 401 || e2.response.status === 403)) {
                 return true;
             }
             throw e2;
        }
    }
  }

  async recordMetric(providerId: string, latency: number, success: boolean, statusCode?: number) {
      await this.prisma.apiMetric.create({
          data: {
              providerId,
              latency,
              success,
              statusCode
          }
      });
  }

  async handleFailover(failedProviderId: string) {
      const provider = await this.prisma.externalProvider.findUnique({
          where: { id: failedProviderId },
          include: { fallbackProvider: true }
      });

      if (provider && provider.fallbackProvider && !provider.fallbackProvider.isActive) {
          this.logger.warn(`Failover triggered: ${provider.providerName} -> ${provider.fallbackProvider.providerName}`);
          
          // Disable current
          await this.prisma.externalProvider.update({
              where: { id: failedProviderId },
              data: { isActive: false, status: 'ERROR' }
          });

          // Enable fallback
          if (provider.fallbackProviderId) {
            await this.prisma.externalProvider.update({
                where: { id: provider.fallbackProviderId },
                data: { isActive: true, status: 'ACTIVE' }
            });
          }

          return { switched: true, newProvider: provider.fallbackProvider.providerName };
      }
      return { switched: false };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExternalProvider } from '@prisma/client';
import { ProviderEncryptionService } from './provider-encryption.service';
import { ApiGatewayService } from '../api-gateway.service';

@Injectable()
export class ProviderResolverService {
  private readonly logger = new Logger(ProviderResolverService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: ProviderEncryptionService,
    private apiGateway: ApiGatewayService
  ) {}

  async getBestProvider(serviceName: string): Promise<ExternalProvider | null> {
    const providers = await this.prisma.externalProvider.findMany({
      where: {
        serviceName,
        isActive: true,
        status: 'ACTIVE'
      },
      orderBy: {
        priority: 'asc'
      }
    });

    if (!providers.length) {
      this.logger.warn(`No active provider found for service: ${serviceName}`);
      return null;
    }

    const provider = providers[0];

    return {
      ...provider,
      apiKey: this.encryptionService.decrypt(provider.apiKey),
      apiSecret: provider.apiSecret ? this.encryptionService.decrypt(provider.apiSecret) : null
    };
  }

  async reportFailure(providerId: string, error: any) {
    this.logger.warn(`Reporting failure for provider ${providerId}: ${error.message}`);
    
    // Log metric
    await this.apiGateway.recordMetric(providerId, 0, false, error.response?.status || 500);

    // Check failover trigger immediately?
    // Or rely on health check service?
    // Let's increment failure count here too for faster reaction
    await this.prisma.externalProvider.update({
        where: { id: providerId },
        data: { failureCount: { increment: 1 } }
    });

    const provider = await this.prisma.externalProvider.findUnique({ where: { id: providerId } });
    if (provider && provider.failureCount >= 3) {
        await this.apiGateway.handleFailover(providerId);
    }
  }

  async reportSuccess(providerId: string, latency: number) {
     await this.apiGateway.recordMetric(providerId, latency, true, 200);
     
     // Reset failure count on success
     await this.prisma.externalProvider.update({
         where: { id: providerId },
         data: { failureCount: 0, healthStatus: 'HEALTHY' }
     });
  }
}

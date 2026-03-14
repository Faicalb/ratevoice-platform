import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ApiGatewayService } from '../api-gateway.service';

@Injectable()
export class AutoHealthCheckService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutoHealthCheckService.name);
  private interval: NodeJS.Timeout;

  constructor(private apiGateway: ApiGatewayService) {}

  onModuleInit() {
    this.logger.log('Starting Auto Health Check Service (Every 5 minutes)');
    // Run immediately then schedule
    this.checkAll();
    this.interval = setInterval(() => this.checkAll(), 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async checkAll() {
    this.logger.log('Running scheduled health checks...');
    try {
      const providers = await this.apiGateway.getAllProviders();
      const activeProviders = providers.filter(p => p.isActive);

      for (const provider of activeProviders) {
        try {
          const result = await this.apiGateway.testProvider(provider.id);
          if (!result.success) {
            this.logger.warn(`Health check failed for ${provider.providerName}: ${result.message}`);
            
            // Check failover
            if (provider.failureCount >= 3) {
                const failover = await this.apiGateway.handleFailover(provider.id);
                if (failover.switched) {
                    this.logger.log(`Switched to fallback: ${failover.newProvider}`);
                }
            }
          }
        } catch (e) {
          this.logger.error(`Error checking ${provider.providerName}: ${e.message}`);
        }
      }
    } catch (e) {
      this.logger.error('Health check cycle failed', e);
    }
  }
}

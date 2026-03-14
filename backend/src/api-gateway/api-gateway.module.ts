import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProviderEncryptionService } from './services/provider-encryption.service';
import { ProviderResolverService } from './services/provider-resolver.service';
import { AutoHealthCheckService } from './services/auto-health-check.service';
import { AiOptimizationService } from './services/ai-optimization.service';
import { ApiSeederService } from './services/api-seeder.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    ProviderEncryptionService,
    ProviderResolverService,
    AutoHealthCheckService,
    AiOptimizationService,
    ApiSeederService
  ],
  exports: [ProviderResolverService, ApiGatewayService]
})
export class ApiGatewayModule {}

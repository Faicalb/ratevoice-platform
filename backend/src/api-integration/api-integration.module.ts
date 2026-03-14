import { Module } from '@nestjs/common';
import { ApiIntegrationController } from './api-integration.controller';
import { ApiIntegrationService } from './api-integration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiGatewayModule } from '../api-gateway/api-gateway.module';

@Module({
  imports: [PrismaModule, ApiGatewayModule],
  controllers: [ApiIntegrationController],
  providers: [ApiIntegrationService],
  exports: [ApiIntegrationService]
})
export class ApiIntegrationModule {}

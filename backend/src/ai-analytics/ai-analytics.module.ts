import { Module } from '@nestjs/common';
import { AiAnalyticsController } from './ai-analytics.controller';
import { AiAnalyticsService } from './ai-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiGatewayModule } from '../api-gateway/api-gateway.module';

@Module({
  imports: [PrismaModule, ApiGatewayModule],
  controllers: [AiAnalyticsController],
  providers: [AiAnalyticsService],
  exports: [AiAnalyticsService]
})
export class AiAnalyticsModule {}

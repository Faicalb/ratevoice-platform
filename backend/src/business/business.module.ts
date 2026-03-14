import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessSettingsController } from './business-settings.controller';
import { BusinessSettingsService } from './business-settings.service';
import { BusinessMarketController } from './business-market.controller';
import { ApiIntegrationModule } from '../api-integration/api-integration.module';

@Module({
  imports: [PrismaModule, ApiIntegrationModule],
  controllers: [BusinessController, BusinessSettingsController, BusinessMarketController],
  providers: [BusinessService, BusinessSettingsService]
})
export class BusinessModule {}

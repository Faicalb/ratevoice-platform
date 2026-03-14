import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdminAdsController } from './admin-ads.controller';
import { AdsService } from './ads.service';
import { AdsAiService } from './ads-ai.service';
import { AdsAnalyticsService } from './ads-analytics.service';
import { AdsTargetingService } from './ads-targeting.service';
import { AdsBillingService } from './ads-billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [AdsController, AdminAdsController],
  providers: [
    AdsService,
    AdsAiService,
    AdsAnalyticsService,
    AdsTargetingService,
    AdsBillingService
  ],
  exports: [AdsService]
})
export class AdsModule {}

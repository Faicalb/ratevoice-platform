import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBusinessController } from './admin-business.controller';
import { AdminBusinessService } from './admin-business.service';
import { AiBusinessService } from './ai-business.service';
import { AiOwnerEmailFinderService } from './ai-owner-email-finder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiIntegrationModule } from '../api-integration/api-integration.module';
import { ApiIntegrationService } from '../api-integration/api-integration.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, ApiIntegrationModule, WalletModule],
  controllers: [AdminController, AdminBusinessController],
  providers: [AdminService, AdminBusinessService, AiBusinessService, AiOwnerEmailFinderService, ApiIntegrationService],
  exports: [AiOwnerEmailFinderService]
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { GlobalDataEngineController } from './global-data-engine.controller';
import { GlobalDataEngineService } from './global-data-engine.service';
import { GlobalDiscoveryService } from './global-discovery.service';
import { BusinessImportService } from './business-import.service';
import { ImageImportService } from './image-import.service';
import { ReviewImportService } from './review-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiIntegrationModule } from '../api-integration/api-integration.module';
import { StorageModule } from '../storage/storage.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    ApiIntegrationModule,
    StorageModule,
    AdminModule // For AiOwnerEmailFinderService
  ],
  controllers: [GlobalDataEngineController],
  providers: [
    GlobalDataEngineService,
    GlobalDiscoveryService,
    BusinessImportService,
    ImageImportService,
    ReviewImportService
  ],
  exports: [GlobalDataEngineService]
})
export class GlobalDataEngineModule {}

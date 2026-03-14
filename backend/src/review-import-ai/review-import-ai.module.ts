import { Module } from '@nestjs/common';
import { ReviewImportController } from './review-import.controller';
import { ReviewImportService } from './review-import.service';
import { ReviewAnalysisService } from './review-analysis.service';
import { ReviewMappingService } from './review-mapping.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiIntegrationModule } from '../api-integration/api-integration.module';
import { AiAnalyticsModule } from '../ai-analytics/ai-analytics.module'; // To reuse logic if exported, or just use our local service

@Module({
  imports: [
    PrismaModule,
    ApiIntegrationModule,
    AiAnalyticsModule
  ],
  controllers: [ReviewImportController],
  providers: [
    ReviewImportService,
    ReviewAnalysisService,
    ReviewMappingService
  ],
  exports: [ReviewImportService]
})
export class ReviewImportAiModule {}

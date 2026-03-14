import { Module } from '@nestjs/common';
import { SeoIntelligenceService } from './seo-intelligence.service';
import { SeoIntelligenceController } from './seo-intelligence.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleSeoService } from './services/google-seo.service';
import { BingSeoService } from './services/bing-seo.service';
import { SerpTrackerService } from './services/serp-tracker.service';
import { BacklinkService } from './services/backlink.service';
import { CrawlerService } from './services/crawler.service';
import { ContentGeneratorService } from './services/content-generator.service';
import { GlobalSeoService } from './services/global-seo.service';
import { SeoPageGeneratorService } from './services/seo-page-generator.service';

@Module({
  imports: [PrismaModule],
  controllers: [SeoIntelligenceController],
  providers: [
    SeoIntelligenceService,
    GoogleSeoService,
    BingSeoService,
    SerpTrackerService,
    BacklinkService,
    CrawlerService,
    ContentGeneratorService,
    GlobalSeoService,
    SeoPageGeneratorService
  ],
  exports: [SeoIntelligenceService, GlobalSeoService, SeoPageGeneratorService]
})
export class SeoIntelligenceModule {}

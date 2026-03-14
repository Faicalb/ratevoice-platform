import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { AdminSeoController } from './admin-seo.controller';
import { SeoService } from './seo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoAiModule } from '../seo-ai/seo-ai.module';
import { SeoIntelligenceModule } from '../seo-intelligence/seo-intelligence.module';

@Module({
  imports: [PrismaModule, SeoAiModule, SeoIntelligenceModule],
  controllers: [SeoController, AdminSeoController],
  providers: [SeoService],
  exports: [SeoService]
})
export class SeoModule {}

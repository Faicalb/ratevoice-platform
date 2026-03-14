import { Module } from '@nestjs/common';
import { SeoAiService } from './seo-ai.service';
import { SeoAiController } from './seo-ai.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SeoAiController],
  providers: [SeoAiService],
  exports: [SeoAiService]
})
export class SeoAiModule {}

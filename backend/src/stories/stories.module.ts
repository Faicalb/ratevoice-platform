import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { AdminStoriesController } from './admin-stories.controller';
import { StoriesService } from './stories.service';
import { StoriesAiService } from './stories-ai.service';
import { StoryAdsService } from './story-ads.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StoriesController, AdminStoriesController],
  providers: [StoriesService, StoriesAiService, StoryAdsService],
  exports: [StoriesService]
})
export class StoriesModule {}

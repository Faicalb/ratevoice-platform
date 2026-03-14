import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { AdminVoiceReviewsController } from './admin-voice-reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ReviewsController, AdminVoiceReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule {}

import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/voice-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminVoiceReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getAllVoiceReviews() {
    const { voiceReviews } = await this.reviewsService.findAll();
    return voiceReviews;
  }

  @Delete(':id')
  async deleteVoiceReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id, 'voice');
  }
}

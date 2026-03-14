import { Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get()
  async findAll() {
    return this.reviewsService.findAll();
  }

  @Get('business/:branchId')
  async getBusinessReviews(@Param('branchId') branchId: string) {
    return this.reviewsService.getVoiceReviews(branchId);
  }

  @Post('upload-voice')
  @UseGuards(JwtAuthGuard) // Only logged in users can post
  @UseInterceptors(FileInterceptor('file'))
  async uploadVoiceReview(
    @UploadedFile() file: any,
    @Body('userId') userId: string,
    @Body('branchId') branchId: string,
    @Body('rating') rating: number
  ) {
    return this.reviewsService.createVoiceReview(file, userId, branchId, rating);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'BUSINESS')
  @Delete(':id')
  async deleteReview(@Param('id') id: string, @Query('type') type: 'voice' | 'text' = 'voice') {
    return this.reviewsService.deleteReview(id, type);
  }
}

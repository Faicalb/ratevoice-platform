import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { ReviewImportService } from './review-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/review-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class ReviewImportController {
  constructor(private readonly importService: ReviewImportService) {}

  @Post('business')
  async importForBusiness(@Body() data: { businessId: string; limit?: number }) {
    return this.importService.importReviewsForBusiness(data.businessId, data.limit);
  }

  @Post('city')
  async importForCity(@Body() data: { city: string; country: string; limit?: number }) {
    return this.importService.importReviewsByCity(data.city, data.country, data.limit);
  }
}

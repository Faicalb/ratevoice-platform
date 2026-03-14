import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewImportService {
  private readonly logger = new Logger(ReviewImportService.name);

  constructor(private prisma: PrismaService) {}

  async processReviews(businessId: string, reviews: any[]) {
    this.logger.warn(`Review import requested but not implemented`);
    throw new NotImplementedException('Review import is not implemented');
  }
}

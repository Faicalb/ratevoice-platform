import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SerpTrackerService {
  constructor(private prisma: PrismaService) {}

  async getRankings(businessId: string) {
    return this.prisma.keywordRanking.findMany({
      where: { businessId },
      orderBy: { position: 'asc' }
    });
  }

  async trackKeywords(businessId: string, keywords: string[]) {
    throw new NotImplementedException('SERP tracking is not configured');
  }
}

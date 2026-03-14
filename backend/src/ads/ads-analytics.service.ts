import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdsAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getCampaignAnalytics(adId: string) {
    return this.prisma.adAnalytics.findMany({
      where: { adId },
      orderBy: { date: 'desc' }
    });
  }

  async trackImpression(adId: string) {
    // Increment impressions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await this.prisma.adAnalytics.upsert({
      where: {
        adId_date: {
          adId,
          date: today
        }
      },
      update: {
        impressions: { increment: 1 }
      },
      create: {
        adId,
        date: today,
        impressions: 1,
        clicks: 0,
        spend: 0,
        revenue: 0,
        ctr: 0
      }
    });
  }
}

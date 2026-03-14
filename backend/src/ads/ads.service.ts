import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdsAnalyticsService } from './ads-analytics.service';

@Injectable()
export class AdsService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AdsAnalyticsService
  ) {}

  // --- BUSINESS METHODS ---
  async getCampaigns(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];
    return this.prisma.adCampaign.findMany({
        where: { businessId: business.id },
        include: { ads: true, _count: { select: { ads: true } } },
        orderBy: { createdAt: 'desc' }
    });
  }

  async createCampaign(userId: string, data: any) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');
    
    return this.prisma.adCampaign.create({
        data: {
            businessId: business.id,
            name: data.name,
            budget: data.budget,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            status: 'ACTIVE'
        }
    });
  }

  async getAds(campaignId: string) {
      return this.prisma.ad.findMany({
          where: { campaignId },
          include: { analytics: true }
      });
  }

  // --- ADMIN METHODS ---
  async getAllAds() {
    return this.prisma.ad.findMany({
      include: {
        analytics: true,
        campaign: { include: { business: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAd(data: any) {
    return this.prisma.ad.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.banner_image,
        advertiserId: data.advertiser_id,
        advertiserType: data.advertiser_type,
        placement: data.placement,
        pricingModel: data.pricing_model,
        targetCountry: data.target_country,
        targetCity: data.target_city,
        budget: data.total_budget || 0,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        status: 'ACTIVE'
      }
    });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.ad.update({
      where: { id },
      data: { status }
    });
  }

  async deleteAd(id: string) {
    // Delete related analytics first or rely on cascade? 
    // Prisma schema didn't specify cascade for analytics.
    // Let's manually delete to be safe or update schema. 
    // Schema relation: ad Ad @relation(fields: [adId], references: [id])
    // Default is restricted. I should delete analytics.
    await this.prisma.adAnalytics.deleteMany({ where: { adId: id } });
    await this.prisma.adClick.deleteMany({ where: { adId: id } });
    
    return this.prisma.ad.delete({ where: { id } });
  }

  async getAdAnalytics(id: string) {
    return this.analyticsService.getCampaignAnalytics(id);
  }

  async getDashboardStats() {
    const totalAds = await this.prisma.ad.count();
    const activeAds = await this.prisma.ad.count({ where: { status: 'ACTIVE' } });
    const pausedAds = await this.prisma.ad.count({ where: { status: 'PAUSED' } });
    
    const revenue = await this.prisma.ad.aggregate({ _sum: { revenue: true } });
    const clicks = await this.prisma.ad.aggregate({ _sum: { clicks: true } });
    const impressions = await this.prisma.ad.aggregate({ _sum: { impressions: true } });

    const totalClicks = clicks._sum.clicks || 0;
    const totalImpressions = impressions._sum.impressions || 0;

    return {
      totalAds,
      activeAds,
      pausedAds,
      totalRevenue: Number(revenue._sum.revenue || 0),
      totalClicks,
      totalImpressions,
      averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    };
  }

  async getRevenueTrend() {
    // Last 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const analytics = await this.prisma.adAnalytics.groupBy({
        by: ['date'],
        _sum: { revenue: true },
        where: { date: { gte: startDate } },
        orderBy: { date: 'asc' }
    });

    return analytics.map(a => ({
        name: a.date.toISOString().split('T')[0],
        value: Number(a._sum.revenue || 0)
    }));
  }
}

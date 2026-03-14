import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoryAdsService {
  constructor(private prisma: PrismaService) {}

  async createCampaign(storyId: string, data: any) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new Error('Story not found');

    const durationDays = data.duration || 7;

    return this.prisma.storyAdCampaign.create({
      data: {
        storyId,
        businessId: story.businessId,
        budget: Number(data.budget),
        targetCity: data.targetCity,
        targetCountry: data.targetCountry,
        endAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        status: 'active'
      }
    });
  }

  async getActiveAds(city?: string) {
    const where: any = {
      status: 'active',
      endAt: { gt: new Date() }
    };
    
    if (city) {
      where.targetCity = city;
    }

    return this.prisma.storyAdCampaign.findMany({
      where,
      include: { story: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  async getAllAds() {
    return this.prisma.storyAdCampaign.findMany({
      include: { story: { include: { business: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async trackView(campaignId: string) {
    return this.prisma.storyAdCampaign.update({
      where: { id: campaignId },
      data: { views: { increment: 1 } }
    });
  }

  async trackClick(campaignId: string) {
    return this.prisma.storyAdCampaign.update({
      where: { id: campaignId },
      data: { clicks: { increment: 1 } }
    });
  }
}

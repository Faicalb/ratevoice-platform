import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoriesAiService } from './stories-ai.service';
import { StoryAdsService } from './story-ads.service';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private aiService: StoriesAiService,
    private adsService: StoryAdsService
  ) {}

  async createStory(userId: string, data: any) {
    // 1. Get Business
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');

    // 2. Check Limits (Max 4 active stories)
    const activeStories = await this.prisma.story.count({
      where: {
        businessId: business.id,
        status: { in: ['active', 'pending'] },
        expiresAt: { gt: new Date() }
      }
    });

    if (activeStories >= 4) {
      throw new BadRequestException('Max stories limit reached (4/4). Please delete a story or wait for expiration.');
    }

    // 3. AI Moderation
    const moderation = await this.aiService.moderateContent(data.mediaUrl, data.type);
    
    // 4. Create Story
    return this.prisma.story.create({
      data: {
        businessId: business.id,
        mediaUrl: data.mediaUrl,
        type: data.type,
        duration: data.duration || 15,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        status: moderation.isFlagged ? 'flagged' : 'active',
        aiScore: moderation.riskScore
      }
    });
  }

  async getBusinessStories(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];

    return this.prisma.story.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteStory(id: string) {
    return this.prisma.story.delete({ where: { id } });
  }

  async boostStory(id: string, data: any) {
    return this.adsService.createCampaign(id, data);
  }

  // --- ADMIN METHODS ---

  async getAllStories() {
    return this.prisma.story.findMany({
      include: { business: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllAds() {
    return this.adsService.getAllAds();
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.story.update({
      where: { id },
      data: { status }
    });
  }

  async expireStories() {
    // Cron job logic
    return this.prisma.story.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { not: 'expired' }
      },
      data: { status: 'expired' }
    });
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeoAiService } from '../seo-ai/seo-ai.service';

@Injectable()
export class SeoService {
  constructor(
    private prisma: PrismaService,
    private aiService: SeoAiService
  ) {}

  async getBusinessSeo(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) {
      return {
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        seoSlug: "",
        seoScore: 0,
        seoLocked: false,
        seoApproved: false,
        seoFlag: false,
        seoSpamScore: 0
      };
    }
    return {
      ...business,
      seoTitle: business.seoTitle || "",
      seoDescription: business.seoDescription || "",
      seoKeywords: business.seoKeywords || "",
      seoSlug: business.seoSlug || ""
    };
  }

  async updateBusinessSeo(userId: string, data: any) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');
    
    if (business.seoLocked) {
      throw new ForbiddenException('SEO settings are locked by admin');
    }

    // AI Analysis for Score and Spam
    const spamCheck = await this.aiService.detectSpam(data.seoTitle || '', data.seoDescription || '', data.seoKeywords || '');
    const score = this.calculateSeoScore(data, spamCheck.isSpam);

    // Log history
    await this.prisma.seoHistory.create({
      data: {
        businessId: business.id,
        action: 'UPDATE',
        oldValue: {
          title: business.seoTitle,
          desc: business.seoDescription,
          keywords: business.seoKeywords,
          slug: business.seoSlug
        },
        newValue: data,
        editedBy: userId
      }
    });

    return this.prisma.business.update({
      where: { id: business.id },
      data: {
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        seoSlug: data.seoSlug,
        seoScore: score,
        seoApproved: false, // Reset approval on update
        seoUpdatedAt: new Date(),
        seoLastEditedBy: userId,
        seoFlag: spamCheck.isSpam,
        seoSpamScore: spamCheck.score
      }
    });
  }

  // --- ADMIN METHODS ---

  async getAllBusinessSeo(filter?: any) {
    return this.prisma.business.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        seoTitle: true,
        seoScore: true,
        seoApproved: true,
        seoLocked: true,
        seoUpdatedAt: true,
        seoFlag: true,
        seoSpamScore: true
      },
      orderBy: { seoUpdatedAt: 'desc' }
    });
  }
  
  async getBusinessSeoById(id: string) {
      return this.prisma.business.findUnique({ where: { id }, include: { seoHealth: true } });
  }

  async updateAdminSeo(id: string, action: 'APPROVE' | 'REJECT' | 'LOCK' | 'UNLOCK' | 'UPDATE', data?: any, adminId?: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    const updateData: any = {};
    if (action === 'APPROVE') updateData.seoApproved = true;
    if (action === 'REJECT') updateData.seoApproved = false;
    if (action === 'LOCK') updateData.seoLocked = true;
    if (action === 'UNLOCK') updateData.seoLocked = false;
    if (action === 'UPDATE' && data) {
        updateData.seoTitle = data.seoTitle;
        updateData.seoDescription = data.seoDescription;
        updateData.seoKeywords = data.seoKeywords;
        updateData.seoSlug = data.seoSlug;
        const spamCheck = await this.aiService.detectSpam(data.seoTitle || '', data.seoDescription || '', data.seoKeywords || '');
        updateData.seoScore = this.calculateSeoScore(data, spamCheck.isSpam);
        updateData.seoFlag = spamCheck.isSpam;
        updateData.seoSpamScore = spamCheck.score;
    }

    await this.prisma.seoHistory.create({
        data: {
            businessId: id,
            action,
            editedBy: adminId,
            oldValue: { locked: business.seoLocked, approved: business.seoApproved },
            newValue: updateData
        }
    });

    return this.prisma.business.update({
        where: { id },
        data: updateData
    });
  }

  // AI-enhanced methods
  async analyzeSeo(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');
    return this.aiService.analyzeBusinessSeo(business.id);
  }

  async autoOptimize(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');
    if (business.seoLocked) throw new ForbiddenException('Locked');
    
    const optimization = await this.aiService.optimizeSeo(business.id);
    
    // Auto apply but keep approval pending
    await this.updateBusinessSeo(userId, optimization);
    
    // Log explicit AI action
    await this.prisma.seoHistory.create({
      data: {
        businessId: business.id,
        action: 'AI_OPTIMIZATION',
        editedBy: 'AI',
        newValue: optimization
      }
    });

    return optimization;
  }

  private calculateSeoScore(data: any, isSpam: boolean): number {
    let score = 0;
    if (data.seoTitle && data.seoTitle.length >= 10 && data.seoTitle.length <= 60) score += 20;
    if (data.seoDescription && data.seoDescription.length >= 50 && data.seoDescription.length <= 160) score += 20;
    if (data.seoKeywords && data.seoKeywords.split(',').length >= 3) score += 20;
    if (data.seoSlug) score += 10; 
    score += 30; // Base score for content existence

    if (isSpam) score -= 20;
    return Math.max(0, Math.min(100, score));
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdsAiService {
  constructor(private prisma: PrismaService) {}

  async suggestBestTarget(adId: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      include: { campaign: { include: { business: { include: { branches: true } } } } }
    });
    if (!ad) throw new NotFoundException('Ad not found');
    const city = ad.campaign?.business?.branches?.[0]?.city || ad.targetCity || '';
    return {
      bestCity: city,
      bestUserType: ad.advertiserType,
      bestSchedule: ''
    };
  }

  async predictBestPlacement(adId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);
    const [ad, agg] = await Promise.all([
      this.prisma.ad.findUnique({ where: { id: adId } }),
      this.prisma.adAnalytics.aggregate({
        where: { adId, date: { gt: since } },
        _avg: { ctr: true }
      })
    ]);
    if (!ad) throw new NotFoundException('Ad not found');
    return {
      placement: ad.placement,
      expectedCtr: Number(agg._avg.ctr || 0)
    };
  }

  async fraudDetection(adId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60_000);
    const clicks = await this.prisma.adClick.findMany({
      where: { adId, clickedAt: { gt: since } },
      select: { ipAddress: true }
    });
    const totalClicks = clicks.length;
    const uniqueIps = new Set(clicks.map((c) => c.ipAddress).filter(Boolean) as string[]).size;
    const ratio = totalClicks === 0 ? 1 : uniqueIps / totalClicks;
    const suspicious = totalClicks >= 100 && ratio < 0.25;
    return {
      isSuspicious: suspicious,
      suspiciousActivity: suspicious ? ['Low unique IP ratio', `uniqueIpRatio=${ratio.toFixed(2)}`] : []
    };
  }

  async autoBudgetOptimization(adId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Ad not found');
    const agg = await this.prisma.adAnalytics.aggregate({
      where: { adId, date: { gt: since } },
      _avg: { ctr: true }
    });
    const ctr = Number(agg._avg.ctr || 0);
    const current = Number(ad.budget as any);
    const up = ctr >= 3;
    const suggestedBudget = Math.max(0, Number((current * (up ? 1.1 : 0.9)).toFixed(2)));
    return {
      suggestedBudget,
      reason: up ? 'CTR above threshold; increase budget' : 'CTR below threshold; reduce budget'
    };
  }
}

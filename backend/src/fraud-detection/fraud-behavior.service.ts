import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudBehaviorService {
  private readonly logger = new Logger(FraudBehaviorService.name);

  constructor(private prisma: PrismaService) {}

  async analyzeEarningsVelocity(ambassadorId: string): Promise<{ score: number; reason?: string }> {
    // Check if daily earnings > 3x average
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await this.prisma.ambassadorActivityLog.findMany({
      where: {
        ambassadorId,
        action: 'REFERRAL_EARNING', // Assuming this action exists or similar
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    if (transactions.length < 5) return { score: 0 }; // Not enough data

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const last24h = transactions.filter(t => t.createdAt >= oneDayAgo).length;
    const totalPeriod = transactions.length;
    const avgDaily = totalPeriod / 30;

    if (avgDaily > 0 && last24h > avgDaily * 5) {
      return { score: 30, reason: `Earnings spike: ${last24h} events vs ${avgDaily.toFixed(1)} avg` };
    }

    if (last24h > 50) {
      return { score: 50, reason: 'Excessive daily activity (>50 referrals)' };
    }

    return { score: 0 };
  }

  async analyzeWithdrawalPatterns(ambassadorId: string): Promise<{ score: number; reason?: string }> {
    const withdrawals = await this.prisma.withdrawalRequest.findMany({
      where: { ambassadorId },
      orderBy: { requestedAt: 'desc' },
      take: 10
    });

    if (withdrawals.length === 0) return { score: 0 };

    // Rule: Multiple withdrawals in 24h
    if (withdrawals.length >= 2) {
      const first = withdrawals[0].requestedAt.getTime();
      const second = withdrawals[1].requestedAt.getTime();
      const diffHours = (first - second) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        return { score: 20, reason: 'Multiple withdrawals within 24 hours' };
      }
    }

    return { score: 0 };
  }
}

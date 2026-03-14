import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FraudBehaviorService } from './fraud-behavior.service';
import { FraudAnomalyService } from './fraud-anomaly.service';

export interface FraudAnalysisResult {
  riskScore: number;
  riskLevel: 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    private prisma: PrismaService,
    private behaviorService: FraudBehaviorService,
    private anomalyService: FraudAnomalyService
  ) {}

  async analyzeAmbassador(ambassadorId: string, context?: {
    deviceHash?: string;
    ipAddress?: string;
    location?: string;
    action?: string;
  }): Promise<FraudAnalysisResult> {
    this.logger.log(`Analyzing fraud risk for ambassador ${ambassadorId}`);

    const ambassador = await this.prisma.ambassador.findUnique({ where: { id: ambassadorId } });
    if (!ambassador) return { riskScore: 0, riskLevel: 'SAFE', reasons: [] };

    let totalScore = 0;
    const reasons: string[] = [];

    // 1. Behavior Analysis
    const earnings = await this.behaviorService.analyzeEarningsVelocity(ambassadorId);
    if (earnings.score > 0) {
      totalScore += earnings.score;
      if (earnings.reason) reasons.push(earnings.reason);
    }

    const withdrawals = await this.behaviorService.analyzeWithdrawalPatterns(ambassadorId);
    if (withdrawals.score > 0) {
      totalScore += withdrawals.score;
      if (withdrawals.reason) reasons.push(withdrawals.reason);
    }

    // 2. Anomaly Analysis
    if (context?.deviceHash && ambassador.userId) {
      const device = await this.anomalyService.checkDeviceFingerprint(ambassador.userId, context.deviceHash);
      if (device.score > 0) {
        totalScore += device.score;
        if (device.reason) reasons.push(device.reason);
      }
    }

    if (context?.location) {
      const geo = await this.anomalyService.checkGeolocation(ambassadorId, context.location);
      if (geo.score > 0) {
        totalScore += geo.score;
        if (geo.reason) reasons.push(geo.reason);
      }
    }

    // 3. Static Profile Checks
    if (ambassador.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && ambassador.balance > 1000) {
      totalScore += 40;
      reasons.push('High earnings on new account (<7 days)');
    }

    // Cap score at 100
    const finalScore = Math.min(100, totalScore);
    const riskLevel = this.getRiskLevel(finalScore);

    // 4. Update Database
    await this.updateRiskProfile(ambassadorId, finalScore, riskLevel, reasons);

    // 5. Automated Actions if CRITICAL
    if (riskLevel === 'CRITICAL') {
      await this.triggerSecurityActions(ambassadorId, reasons);
    }

    return { riskScore: finalScore, riskLevel, reasons };
  }

  private getRiskLevel(score: number): 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'SAFE';
  }

  private async updateRiskProfile(ambassadorId: string, score: number, level: string, reasons: string[]) {
    await this.prisma.ambassadorRisk.upsert({
      where: { ambassadorId },
      update: {
        riskScore: score,
        riskLevel: level,
        reasons,
        lastUpdated: new Date()
      },
      create: {
        ambassadorId,
        riskScore: score,
        riskLevel: level,
        reasons
      }
    });
  }

  private async triggerSecurityActions(ambassadorId: string, reasons: string[]) {
    this.logger.warn(`CRITICAL RISK DETECTED for ambassador ${ambassadorId}. Taking security actions.`);

    // 1. Freeze withdrawals
    await this.prisma.withdrawalRequest.updateMany({
      where: { ambassadorId, status: 'PENDING' },
      data: { status: 'FROZEN' }
    });

    // 2. Log Fraud Event
    await this.prisma.fraudEvent.create({
      data: {
        ambassadorId,
        fraudType: 'AUTOMATED_RISK_BLOCK',
        severity: 'CRITICAL',
        description: `Account frozen due to critical risk score (Reasons: ${reasons.join(', ')})`,
        isResolved: false
      }
    });

    // 3. Update Status (Optional - user might want to manually review)
    await this.prisma.ambassador.update({
      where: { id: ambassadorId },
      data: { status: 'SUSPENDED' }
    });
  }

  async getFraudEvents() {
    return this.prisma.fraudEvent.findMany({
      orderBy: { detectedAt: 'desc' },
      include: { ambassador: { select: { name: true, email: true } } },
      take: 50
    });
  }

  async getHighRiskAmbassadors() {
    return this.prisma.ambassadorRisk.findMany({
      where: { riskScore: { gte: 50 } },
      include: { ambassador: { select: { name: true, email: true, status: true } } },
      orderBy: { riskScore: 'desc' }
    });
  }
}

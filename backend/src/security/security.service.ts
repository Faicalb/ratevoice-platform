import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async listAlerts(take = 200) {
    return this.prisma.adminSecurityAlert.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        business: { select: { id: true, name: true, status: true } },
        walletTransaction: true
      }
    });
  }

  private async upsertOpenAlert(input: {
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    type: string;
    description: string;
    source?: string | null;
    details?: any;
    userId?: string | null;
    businessId?: string | null;
    walletTransactionId?: string | null;
  }) {
    const existing = await this.prisma.adminSecurityAlert.findFirst({
      where: {
        status: { in: ['NEW', 'INVESTIGATING'] },
        type: input.type,
        description: input.description,
        userId: input.userId ?? null,
        businessId: input.businessId ?? null,
        walletTransactionId: input.walletTransactionId ?? null
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      return this.prisma.adminSecurityAlert.update({
        where: { id: existing.id },
        data: { updatedAt: new Date(), details: input.details ?? existing.details }
      });
    }

    return this.prisma.adminSecurityAlert.create({
      data: {
        severity: input.severity as any,
        type: input.type,
        description: input.description,
        source: input.source ?? null,
        details: input.details ?? null,
        userId: input.userId ?? null,
        businessId: input.businessId ?? null,
        walletTransactionId: input.walletTransactionId ?? null,
        status: 'NEW'
      }
    });
  }

  async refreshAlerts() {
    const now = Date.now();
    const lastHour = new Date(now - 60 * 60_000);
    const lastDay = new Date(now - 24 * 60 * 60_000);

    const failedByIp = await this.prisma.securityEvent.groupBy({
      by: ['ipAddress'],
      where: { createdAt: { gt: lastHour }, eventType: 'FAILED_LOGIN', ipAddress: { not: null } },
      _count: { ipAddress: true }
    });

    for (const row of failedByIp) {
      const count = row._count.ipAddress || 0;
      if (count >= 5 && row.ipAddress) {
        await this.upsertOpenAlert({
          severity: count >= 20 ? 'CRITICAL' : 'HIGH',
          type: 'login',
          description: `Multiple failed logins from IP ${row.ipAddress}`,
          source: 'auth',
          details: { ip: row.ipAddress, attempts: count, window: '1h' }
        });
      }
    }

    const flaggedTx = await this.prisma.walletTransaction.findMany({
      where: { createdAt: { gt: lastDay }, OR: [{ fraudFlag: true }, { riskScore: { gte: 80 } }] },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    for (const tx of flaggedTx) {
      await this.upsertOpenAlert({
        severity: tx.fraudFlag ? 'CRITICAL' : 'HIGH',
        type: 'transaction',
        description: 'Suspicious wallet transaction flagged',
        source: tx.provider || 'wallet',
        walletTransactionId: tx.id,
        details: { transactionId: tx.id, riskScore: tx.riskScore, fraudFlag: tx.fraudFlag, providerRefId: tx.providerRefId || null }
      });
    }

    const velocity = await this.prisma.walletTransaction.groupBy({
      by: ['walletId'],
      where: { createdAt: { gt: lastHour } },
      _count: { walletId: true }
    });

    for (const row of velocity) {
      const count = row._count.walletId || 0;
      if (count >= 20) {
        await this.upsertOpenAlert({
          severity: count >= 50 ? 'CRITICAL' : 'MEDIUM',
          type: 'transaction',
          description: 'Rapid wallet transaction velocity detected',
          source: 'wallet',
          details: { walletId: row.walletId, transactionCount: count, window: '1h' }
        });
      }
    }

    const adminActions = await this.prisma.adminFinancialLog.groupBy({
      by: ['adminId'],
      where: { createdAt: { gt: lastHour } },
      _count: { adminId: true }
    });

    for (const row of adminActions) {
      const count = row._count.adminId || 0;
      if (count >= 10) {
        await this.upsertOpenAlert({
          severity: count >= 25 ? 'HIGH' : 'MEDIUM',
          type: 'admin_action',
          description: 'High frequency admin financial actions detected',
          source: 'admin',
          userId: row.adminId,
          details: { adminId: row.adminId, actionCount: count, window: '1h' }
        });
      }
    }

    return this.listAlerts();
  }

  async updateAlertStatus(adminId: string, alertId: string, status: 'NEW' | 'INVESTIGATING' | 'RESOLVED') {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.adminSecurityAlert.update({
        where: { id: alertId },
        data: {
          status,
          resolvedByAdminId: status === 'RESOLVED' ? adminId : null,
          resolvedAt: status === 'RESOLVED' ? new Date() : null
        }
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_SECURITY_ALERT_STATUS',
          resource: 'SECURITY',
          details: { alertId, status }
        }
      });

      return updated;
    });
  }

  async getBusinessSecurityStatus() {
    const businesses = await this.prisma.business.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: { verifications: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    return businesses.map((b) => {
      const verification = b.verifications[0];
      const certificateStatus = verification ? (verification.status === 'APPROVED' ? 'Generated' : verification.status === 'REJECTED' ? 'Revoked' : 'Pending') : 'Pending';
      const activationStatus = b.status === 'ACTIVE' ? 'Activated' : b.status === 'SUSPENDED' ? 'Suspended' : 'Pending';
      return {
        id: b.id,
        businessName: b.name,
        token: b.id,
        registrationDate: b.createdAt.toISOString().slice(0, 10),
        certificateStatus,
        deviceStatus: 'Pending',
        activationStatus,
        certificateId: verification?.id || null
      };
    });
  }

  async setBusinessStatus(adminId: string, businessId: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.business.update({ where: { id: businessId }, data: { status } });
      await tx.auditLog.create({
        data: { userId: adminId, action: 'ADMIN_BUSINESS_STATUS', resource: 'BUSINESS', details: { businessId, status } }
      });
      return updated;
    });
  }

  async setBusinessVerificationStatus(adminId: string, businessId: string, status: 'APPROVED' | 'REJECTED') {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.businessVerification.create({
        data: {
          businessId,
          documentUrl: 'ADMIN_VERIFICATION',
          status,
          verifiedAt: status === 'APPROVED' ? new Date() : null,
          rejectionReason: status === 'REJECTED' ? 'Revoked by admin' : null
        }
      });
      await tx.auditLog.create({
        data: { userId: adminId, action: 'ADMIN_BUSINESS_VERIFICATION', resource: 'BUSINESS', details: { businessId, status, verificationId: verification.id } }
      });
      return verification;
    });
  }
}

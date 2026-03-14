import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats() {
    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalBookings,
      totalRevenue, // Needs calculation
      activeAlerts
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.business.count(),
      this.prisma.textReview.count(),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true }
      }),
      this.prisma.securityEvent.count({ where: { severity: 'CRITICAL' } })
    ]);

    return {
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      activeAlerts
    };
  }

  async getSystemHealth() {
    // Simple checks
    const dbStatus = await this.prisma.$queryRaw`SELECT 1`;
    return {
      database: dbStatus ? 'UP' : 'DOWN',
      server: 'UP',
      lastChecked: new Date()
    };
  }

  async getUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            createdAt: true,
            roles: {
                include: { role: true }
            }
        }
      }),
      this.prisma.user.count()
    ]);
    return { data: users, total, page, limit };
  }

  async getBusinesses(page: number = 1, limit: number = 10) {
      const skip = (page - 1) * limit;
      const [businesses, total] = await Promise.all([
          this.prisma.business.findMany({
              skip,
              take: limit,
              orderBy: { createdAt: 'desc' },
              include: {
                  owner: {
                      select: { email: true, fullName: true }
                  }
              }
          }),
          this.prisma.business.count()
      ]);
      return { data: businesses, total, page, limit };
  }

  async getFeatures() {
    const key = 'system_features';
    const existing = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (existing) {
      try {
        return JSON.parse(existing.value);
      } catch {
        return [];
      }
    }

    const defaults = [
      { id: 'SRV-AUTH', name: 'Auth', key: 'auth', category: 'developer_platform', status: 'active', load: 0, dependencies: [], lastUpdated: new Date().toISOString(), errorRate: 0, version: '1.0.0' },
      { id: 'SRV-WALLET', name: 'Wallet', key: 'wallet', category: 'client_app', status: 'active', load: 0, dependencies: ['payment_gateway'], lastUpdated: new Date().toISOString(), errorRate: 0, version: '1.0.0' },
      { id: 'SRV-NOTIFY', name: 'Notifications', key: 'notifications', category: 'client_app', status: 'active', load: 0, dependencies: [], lastUpdated: new Date().toISOString(), errorRate: 0, version: '1.0.0' },
      { id: 'SRV-ANALYTICS', name: 'Analytics', key: 'analytics', category: 'business_platform', status: 'active', load: 0, dependencies: [], lastUpdated: new Date().toISOString(), errorRate: 0, version: '1.0.0' },
      { id: 'SRV-SECURITY', name: 'Security Alerts', key: 'security_alerts', category: 'developer_platform', status: 'active', load: 0, dependencies: ['auth'], lastUpdated: new Date().toISOString(), errorRate: 0, version: '1.0.0' },
      { id: 'SRV-SUBS', name: 'Subscriptions', key: 'subscriptions', category: 'business_platform', status: 'active', load: 0, dependencies: [], lastUpdated: new Date().toISOString(), errorRate: 0, version: '1.0.0' }
    ];

    await this.prisma.systemSetting.create({
      data: { key, type: 'JSON', value: JSON.stringify(defaults) }
    });
    return defaults;
  }

  async updateFeature(adminId: string, key: string, updates: any) {
    const current = await this.getFeatures();
    const next = Array.isArray(current)
      ? current.map((f: any) => (f.key === key ? { ...f, ...updates, lastUpdated: new Date().toISOString() } : f))
      : current;

    await this.prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: 'system_features' },
        create: { key: 'system_features', type: 'JSON', value: JSON.stringify(next) },
        update: { type: 'JSON', value: JSON.stringify(next) }
      });
      await tx.auditLog.create({
        data: { userId: adminId, action: 'ADMIN_FEATURE_UPDATE', resource: 'SYSTEM', details: { key, updates } }
      });
    });
    return { success: true };
  }

  async getAiSettings() {
    const key = 'ai_engine_settings';
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (row) {
      try {
        return JSON.parse(row.value);
      } catch {
        return null;
      }
    }
    const defaults = {
      sensitivity: 70,
      models: { sentiment: 'default', image: 'default', recommendation: 'default' },
      features: { moderation: true, translation: true, recommendations: true, autoReply: false },
      limits: { dailyBudget: 0, maxRequestsPerMin: 0 },
      usage: { dailyRequests: 0, cost: 0, errorRate: 0 }
    };
    await this.prisma.systemSetting.create({ data: { key, type: 'JSON', value: JSON.stringify(defaults) } });
    return defaults;
  }

  async updateAiSettings(adminId: string, settings: any) {
    await this.prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: 'ai_engine_settings' },
        create: { key: 'ai_engine_settings', type: 'JSON', value: JSON.stringify(settings) },
        update: { type: 'JSON', value: JSON.stringify(settings) }
      });
      await tx.auditLog.create({ data: { userId: adminId, action: 'ADMIN_AI_SETTINGS_UPDATE', resource: 'SYSTEM', details: {} } });
    });
    return { success: true };
  }
}

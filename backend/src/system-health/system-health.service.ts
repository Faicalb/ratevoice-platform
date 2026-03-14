import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';

@Injectable()
export class SystemHealthService {
  constructor(private prisma: PrismaService) {}

  async getSystemOverview() {
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuUsage = os.loadavg()[0]; // 1 minute load average

    const now = new Date();
    const [activeUsers, requestsPerMinute] = await Promise.all([
      this.prisma.loginSession.count({
        where: { isValid: true, expiresAt: { gt: now } }
      }),
      this.prisma.trafficLog.count({
        where: { timestamp: { gt: new Date(Date.now() - 60_000) } }
      })
    ]);

    return {
      server: 'healthy',
      database: 'connected', // Prisma is injected, so it's connected
      memory: `${Math.round((usedMem / totalMem) * 100)}%`,
      cpu: `${Math.round(cpuUsage * 10)}%`, // Approximate percentage
      requestsPerMinute,
      activeUsers,
      uptime: process.uptime()
    };
  }

  async getApiPerformance() {
    const since = new Date(Date.now() - 15 * 60_000);
    const grouped = await this.prisma.trafficLog.groupBy({
      by: ['path'],
      where: { timestamp: { gt: since } },
      _count: { path: true }
    });

    const paths = grouped
      .sort((a, b) => (b._count.path || 0) - (a._count.path || 0))
      .slice(0, 10)
      .map((g) => g.path);

    const errorCounts = await this.prisma.trafficLog.groupBy({
      by: ['path'],
      where: { timestamp: { gt: since }, statusCode: { gte: 400 }, path: { in: paths } },
      _count: { path: true }
    });
    const errorsByPath = new Map(errorCounts.map((r) => [r.path, r._count.path || 0]));

    return grouped
      .filter((g) => paths.includes(g.path))
      .map((g) => {
        const requests = g._count.path || 0;
        const errors = errorsByPath.get(g.path) || 0;
        return {
          endpoint: g.path,
          requests,
          avgResponseTime: 0,
          errorRate: requests === 0 ? 0 : Number(((errors / requests) * 100).toFixed(2))
        };
      });
  }

  async getErrors() {
    const since = new Date(Date.now() - 60 * 60_000);
    const logs = await this.prisma.trafficLog.findMany({
      where: { timestamp: { gt: since }, statusCode: { gte: 400 } },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return logs.map((l) => ({
      timestamp: l.timestamp,
      endpoint: l.path,
      error: l.statusCode >= 500 ? 'Server error' : 'Client error',
      statusCode: l.statusCode
    }));
  }

  async getSecurityThreats() {
    const since = new Date(Date.now() - 24 * 60 * 60_000);
    const suspiciousIPs = await this.prisma.securityEvent.groupBy({
      by: ['ipAddress'],
      _count: { ipAddress: true },
      where: { createdAt: { gt: since }, eventType: 'FAILED_LOGIN', ipAddress: { not: null } }
    });

    const [failedLoginAttempts, blockedRequests] = await Promise.all([
      this.prisma.securityEvent.count({
        where: { createdAt: { gt: since }, eventType: 'FAILED_LOGIN' }
      }),
      this.prisma.trafficLog.count({
        where: { timestamp: { gt: since }, statusCode: 429 }
      })
    ]);

    return {
      suspiciousIPs: suspiciousIPs
        .filter((ip) => (ip._count.ipAddress || 0) >= 5)
        .map((ip) => ({ ip: ip.ipAddress, attempts: ip._count.ipAddress })),
      failedLoginAttempts,
      blockedRequests
    };
  }

  async getUserActivity() {
    const [activeNow, newToday, reviewsToday] = await Promise.all([
        this.prisma.loginSession.count({ where: { expiresAt: { gt: new Date() } } }),
        this.prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
        this.prisma.textReview.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } })
    ]);

    return {
        activeUsersNow: activeNow,
        newUsersToday: newToday,
        reviewsPostedToday: reviewsToday
    };
  }

  async getDatabaseHealth() {
    // Check DB connection
    let status = 'connected';
    try {
        await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
        status = 'error';
    }

    const userCount = await this.prisma.user.count();
    const reviewCount = await this.prisma.textReview.count();

    let databaseSize: string | null = null;
    let totalTables: number | null = null;
    try {
      const sizeRow: any = await this.prisma.$queryRaw`SELECT pg_database_size(current_database()) as bytes`;
      const bytes = Array.isArray(sizeRow) ? Number(sizeRow[0]?.bytes) : Number((sizeRow as any)?.bytes);
      if (Number.isFinite(bytes)) databaseSize = `${Math.round(bytes / (1024 * 1024))}MB`;
    } catch {}

    try {
      const tablesRow: any = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const count = Array.isArray(tablesRow) ? Number(tablesRow[0]?.count) : Number((tablesRow as any)?.count);
      if (Number.isFinite(count)) totalTables = count;
    } catch {}
    
    return {
        connectionStatus: status,
        databaseSize: databaseSize || 'unknown',
        totalTables: totalTables ?? 0,
        slowQueries: 0,
        missingIndexes: 0,
        recordCounts: {
            users: userCount,
            reviews: reviewCount
        }
    };
  }
}

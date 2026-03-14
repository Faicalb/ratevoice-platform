import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getBusinessDashboardStats(userId: string) {
    // Find business owned by user
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return { totalReviews: 0, totalBookings: 0, activeAds: 0, recentReviews: [] };

    const cacheKey = `dash_stats_${business.id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const [textReviews, voiceReviews, bookings, activeAds, recentReviews, revenue] = await Promise.all([
      this.prisma.textReview.count({ where: { branch: { businessId: business.id } } }),
      this.prisma.voiceReview.count({ where: { branch: { businessId: business.id } } }),
      this.prisma.booking.count({ where: { branch: { businessId: business.id } } }),
      this.prisma.ad.count({ where: { campaign: { businessId: business.id }, status: 'ACTIVE' } }),
      this.prisma.textReview.findMany({
        where: { branch: { businessId: business.id } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, avatarUrl: true } } }
      }),
      this.prisma.booking.aggregate({ where: { branch: { businessId: business.id } }, _sum: { totalAmount: true } })
    ]);

    const stats = {
      totalReviews: textReviews + voiceReviews,
      totalBookings: bookings,
      activeAds,
      recentReviews,
      revenue: Number(revenue._sum.totalAmount || 0)
    };

    await this.cacheManager.set(cacheKey, stats, 60 * 1000);
    return stats;
  }

  async getBusinessTrends(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];

    const reviews = await this.prisma.textReview.findMany({
      where: {
        branch: { businessId: business.id },
        createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
      },
      select: { createdAt: true }
    });

    const bookings = await this.prisma.booking.findMany({
        where: {
            branch: { businessId: business.id },
            createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
        },
        select: { createdAt: true }
    });

    const map = new Map<string, {reviews: number, bookings: number}>();
    
    for(let i=0; i<30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map.set(d.toISOString().split('T')[0], { reviews: 0, bookings: 0 });
    }

    reviews.forEach(r => {
        const d = r.createdAt.toISOString().split('T')[0];
        if(map.has(d)) map.get(d)!.reviews++;
    });

    bookings.forEach(b => {
        const d = b.createdAt.toISOString().split('T')[0];
        if(map.has(d)) map.get(d)!.bookings++;
    });

    return Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts })).reverse();
  }

  async getBusinessAnalyticsSummary(userId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
      include: { branches: { select: { id: true, name: true } } }
    });
    if (!business) {
      return {
        sentiment: { positive: 0, neutral: 0, negative: 0, history: [] },
        peakHours: [],
        branches: [],
        performance: { avgResponseTime: '', responseRate: 0, resolvedComplaints: 0 }
      };
    }

    const branchIds = business.branches.map((b) => b.id);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const reviews = await this.prisma.textReview.findMany({
      where: { branchId: { in: branchIds }, createdAt: { gt: since } },
      select: { createdAt: true, sentiment: true, rating: true, branchId: true }
    });

    const pos = reviews.filter((r) => (r.sentiment || '').toUpperCase() === 'POSITIVE').length;
    const neg = reviews.filter((r) => (r.sentiment || '').toUpperCase() === 'NEGATIVE').length;
    const total = reviews.length;
    const neu = Math.max(0, total - pos - neg);
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

    const monthly = new Map<string, number[]>();
    for (const r of reviews) {
      const key = `${r.createdAt.getUTCFullYear()}-${String(r.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!monthly.has(key)) monthly.set(key, []);
      monthly.get(key)!.push(Number(r.rating));
    }
    const history = Array.from(monthly.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, arr]) => ({
        date,
        score: Math.round((arr.reduce((s, v) => s + v, 0) / Math.max(1, arr.length)) * 20)
      }));

    const bookings = await this.prisma.booking.findMany({
      where: { branchId: { in: branchIds }, createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60_000) } },
      select: { bookingDate: true }
    });
    const hourCounts = new Map<number, number>();
    for (const b of bookings) {
      const h = b.bookingDate.getUTCHours();
      hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
    }
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    const branchStats = await Promise.all(
      business.branches.map(async (br) => {
        const brReviews = reviews.filter((r) => r.branchId === br.id);
        const avg = brReviews.length ? brReviews.reduce((s, r) => s + Number(r.rating), 0) / brReviews.length : 0;
        return { id: br.id, name: br.name, rating: Number(avg.toFixed(2)), reviews: brReviews.length, responseTime: '' };
      })
    );

    return {
      sentiment: {
        positive: pct(pos),
        neutral: pct(neu),
        negative: pct(neg),
        history
      },
      peakHours,
      branches: branchStats,
      performance: {
        avgResponseTime: '',
        responseRate: 0,
        resolvedComplaints: 0
      }
    };
  }

  async getVisitorStats() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const logs = await this.prisma.trafficLog.findMany({
      where: { timestamp: { gt: since } },
      select: { ipAddress: true, timestamp: true }
    });

    const daily = new Map<string, Set<string>>();
    for (const l of logs) {
      const day = l.timestamp.toISOString().split('T')[0];
      if (!daily.has(day)) daily.set(day, new Set());
      if (l.ipAddress) daily.get(day)!.add(l.ipAddress);
    }

    const traffic = Array.from(daily.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, ips]) => ({ date, visitors: ips.size }));

    const current7 = traffic.slice(-7).reduce((sum, r) => sum + r.visitors, 0);
    const prev7 = traffic.slice(-14, -7).reduce((sum, r) => sum + r.visitors, 0);
    const growth = prev7 === 0 ? 0 : Number((((current7 - prev7) / prev7) * 100).toFixed(2));

    const uniqueVisitors = new Set(logs.map((l) => l.ipAddress).filter(Boolean) as string[]).size;

    return {
      stats: [
        {
          id: 'unknown',
          country: 'Unknown',
          visitors: uniqueVisitors,
          growth,
          flag: ''
        }
      ],
      traffic
    };
  }

  async getAdminStats() {
    const cacheKey = `admin_dash_stats`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const [users, businesses, bookings, revenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.business.count(),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({ _sum: { totalAmount: true } })
    ]);

    const stats = {
      totalUsers: users,
      totalBusinesses: businesses,
      totalBookings: bookings,
      totalRevenue: Number(revenue._sum.totalAmount || 0)
    };

    await this.cacheManager.set(cacheKey, stats, 300 * 1000); // 5 mins
    return stats;
  }
}

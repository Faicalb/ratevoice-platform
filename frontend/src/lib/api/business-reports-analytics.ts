import api from './api';

export interface ReportAnalytics {
  overview: {
    totalReviews: number;
    avgRating: number;
    satisfaction: number;
    activeBookings: number;
    revenue: number;
    walletBalance: number;
    adImpressions: number;
    visitors: number;
  };
  charts: {
    reviewTrend: Array<{ date: string; value: number }>;
    bookingsPerDay: Array<{ day: string; value: number }>;
    sentiment: Array<{ name: string; value: number; color: string }>;
    visitorLocations: Array<{ country: string; visitors: number; code: string }>;
  };
  aiInsights: string[];
}

export const reportsAnalyticsApi = {
  getAnalytics: async (period: 'today' | '7days' | '30days' | 'custom' = '30days'): Promise<ReportAnalytics> => {
    const [dashboardRes, trendsRes, summaryRes, walletRes, visitorRes] = await Promise.all([
      api.get('/analytics/business/dashboard'),
      api.get('/analytics/business/trends'),
      api.get('/analytics/business/summary'),
      api.get('/wallet'),
      api.get('/analytics/business/visitor-stats')
    ]);

    const dashboard = dashboardRes.data || {};
    const summary = summaryRes.data || {};
    const wallet = walletRes.data || {};
    const visitors = visitorRes.data || {};

    const reviewTrend = (trendsRes.data || []).slice(-7).map((d: any) => ({ date: d.date, value: Number(d.text || 0) }));
    const bookingsPerDay = (trendsRes.data || []).slice(-7).map((d: any) => ({ day: d.date, value: Number(d.bookings || 0) }));

    return {
      overview: {
        totalReviews: Number(dashboard.totalReviews || 0),
        avgRating: 0,
        satisfaction: Number(summary.sentiment?.positive || 0),
        activeBookings: Number(dashboard.totalBookings || 0),
        revenue: Number(dashboard.revenue || 0),
        walletBalance: Number(wallet.balance || 0),
        adImpressions: 0,
        visitors: Number(visitors.totalVisitors || 0)
      },
      charts: {
        reviewTrend,
        bookingsPerDay,
        sentiment: [
          { name: 'Positive', value: Number(summary.sentiment?.positive || 0), color: '#10b981' },
          { name: 'Neutral', value: Number(summary.sentiment?.neutral || 0), color: '#f59e0b' },
          { name: 'Negative', value: Number(summary.sentiment?.negative || 0), color: '#f43f5e' }
        ],
        visitorLocations: (visitors.topLocations || []).map((l: any) => ({ country: l.country || '', visitors: Number(l.count || 0), code: l.code || '' }))
      },
      aiInsights: []
    };
  }
};

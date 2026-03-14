export interface AnalyticsData {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    history: Array<{ date: string; score: number }>;
  };
  peakHours: Array<{ hour: string; count: number }>;
  branches: Array<{
    id: string;
    name: string;
    rating: number;
    reviews: number;
    responseTime: string;
  }>;
  performance: {
    avgResponseTime: string;
    responseRate: number;
    resolvedComplaints: number;
  };
}

import api from './api';

export const analyticsApi = {
  getData: async (): Promise<AnalyticsData> => {
    const res = await api.get('/analytics/business/summary');
    return res.data;
  }
};

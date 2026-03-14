import api from '../api';

export interface VisitorStat {
  id: string;
  country: string;
  visitors: number;
  growth: number;
  flag: string;
}

export interface TrafficData {
  date: string;
  visitors: number;
  pageViews: number;
}

export const adminAnalyticsApi = {
  getVisitorStats: async (): Promise<{ stats: VisitorStat[]; traffic: TrafficData[] }> => {
    const res = await api.get('/analytics/admin/visitors');
    return res.data;
  }
};

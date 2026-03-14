import api from '../api';

export interface Ad {
  id: string;
  title: string;
  advertiserId: string;
  advertiserType: 'BUSINESS' | 'AMBASSADOR';
  advertiserName?: string;
  placement: string;
  pricingModel: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'PENDING' | 'REJECTED' | 'DRAFT';
  budget: number;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  startDate: string;
  endDate: string;
}

export const adminAdsApi = {
  getAds: async (): Promise<Ad[]> => {
    const res = await api.get('/admin/ads');
    return res.data.map((ad: any) => ({
      id: ad.id,
      title: ad.title,
      advertiserId: ad.advertiserId,
      advertiserType: ad.advertiserType,
      advertiserName: ad.campaign?.business?.name || 'Unknown',
      placement: ad.placement,
      pricingModel: ad.pricingModel,
      status: ad.status,
      budget: Number(ad.budget),
      impressions: ad.impressions,
      clicks: ad.clicks,
      revenue: Number(ad.revenue),
      ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      startDate: ad.startDate,
      endDate: ad.endDate
    }));
  },

  getStats: async () => {
    const res = await api.get('/admin/ads/stats');
    return res.data;
  },

  createAd: async (data: any) => {
    return api.post('/admin/ads', data);
  },

  pauseAd: async (id: string) => {
    return api.patch(`/admin/ads/${id}/pause`);
  },

  resumeAd: async (id: string) => {
    return api.patch(`/admin/ads/${id}/resume`);
  },

  deleteAd: async (id: string) => {
    return api.delete(`/admin/ads/${id}`);
  },

  getAnalytics: async (id: string) => {
    const res = await api.get(`/admin/ads/${id}/analytics`);
    return res.data;
  },

  optimizeAd: async (id: string) => {
    const res = await api.post(`/admin/ads/${id}/optimize`);
    return res.data;
  }
};

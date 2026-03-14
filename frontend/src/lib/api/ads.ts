export interface AdCampaign {
  id: string;
  name: string;
  type: 'cpc' | 'duration';
  status: 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  targeting: {
    locations: string[];
    ageRange?: string;
  };
}

import api from './api';

export const adsApi = {
  getCampaigns: async (): Promise<AdCampaign[]> => {
    const res = await api.get('/ads/campaigns');
    return (res.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: String(c.billingModel || c.type || 'CPC').toLowerCase() === 'duration' ? 'duration' : 'cpc',
      status: String(c.status || 'ACTIVE').toLowerCase() === 'active' ? 'active' : String(c.status || '').toLowerCase() === 'paused' ? 'paused' : 'ended',
      budget: Number(c.budget || 0),
      spent: 0,
      impressions: Number(c.impressions || 0),
      clicks: Number(c.clicks || 0),
      startDate: c.startDate || c.createdAt || '',
      endDate: c.endDate || '',
      targeting: { locations: c.targetCity ? [c.targetCity] : [] }
    }));
  },

  createCampaign: async (data: Partial<AdCampaign>) => {
    const res = await api.post('/ads/campaigns', {
      name: data.name,
      budget: data.budget,
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString().slice(0, 10)
    });
    return res.data;
  }
};

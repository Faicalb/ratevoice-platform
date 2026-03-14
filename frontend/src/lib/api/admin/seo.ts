import api from '../api';

export interface SEOData {
  id: string;
  pageUrl: string;
  title: string;
  description: string;
  keywords: string[];
  status: 'optimized' | 'needs_review' | 'critical';
  lastUpdated: string;
  score: number;
  approved: boolean;
  locked: boolean;
  flagged: boolean;
}

export const adminSeoApi = {
  getAllBusinessSeo: async (): Promise<SEOData[]> => {
    const res = await api.get('/admin/seo/business');
    return res.data.map((b: any) => ({
      id: b.id,
      pageUrl: `/business/${b.seoSlug || b.id}`,
      title: b.seoTitle || b.name,
      description: b.seoDescription || '',
      keywords: b.seoKeywords ? b.seoKeywords.split(',') : [],
      status: (b.seoScore || 0) > 80 ? 'optimized' : (b.seoScore || 0) > 50 ? 'needs_review' : 'critical',
      lastUpdated: b.seoUpdatedAt || new Date().toISOString(),
      score: b.seoScore || 0,
      approved: b.seoApproved,
      locked: b.seoLocked,
      flagged: b.seoFlag
    }));
  },

  getBusinessSeo: async (id: string) => {
    const res = await api.get(`/admin/seo/business/${id}`);
    return res.data;
  },

  updateBusinessSeo: async (id: string, data: any) => {
    return api.patch(`/admin/seo/business/${id}`, data);
  },

  approveSeo: async (id: string) => {
    return api.post(`/admin/seo/business/${id}/approve`);
  },

  rejectSeo: async (id: string) => {
    return api.post(`/admin/seo/business/${id}/reject`);
  },

  lockSeo: async (id: string) => {
    return api.post(`/admin/seo/business/${id}/lock`);
  },

  unlockSeo: async (id: string) => {
    return api.post(`/admin/seo/business/${id}/unlock`);
  },

  getGlobalSettings: async () => {
    const res = await api.get('/admin/seo/global');
    return res.data;
  },

  updateGlobalSettings: async (data: any) => {
    return api.patch('/admin/seo/global', data);
  },

  generatePage: async (data: { city: string, category: string }) => {
    return api.post('/admin/seo/global/generate-page', data);
  },

  getPages: async () => {
    const res = await api.get('/admin/seo/global/pages');
    return res.data;
  }
};

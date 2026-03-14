import api from '../api';

export interface BusinessSeo {
  name?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoSlug?: string;
  seoScore?: number;
  seoApproved?: boolean;
  seoLocked?: boolean;
  seoFlag?: boolean;
  seoSpamScore?: number;
}

export const businessSeoApi = {
  getMySeo: async (): Promise<BusinessSeo> => {
    const res = await api.get('/business/seo');
    return res.data;
  },

  updateMySeo: async (data: BusinessSeo) => {
    const res = await api.patch('/business/seo/update', data);
    return res.data;
  },
  
  analyzeSeo: async () => {
    const res = await api.post('/business/seo/analyze');
    return res.data;
  },

  autoOptimize: async () => {
    const res = await api.post('/business/seo/optimize');
    return res.data;
  },

  getIntelligenceDashboard: async () => {
    const res = await api.get('/seo/intelligence/dashboard');
    return res.data;
  },

  runAudit: async () => {
    const res = await api.post('/seo/intelligence/audit');
    return res.data;
  },

  generateContent: async () => {
    const res = await api.post('/seo/intelligence/content');
    return res.data;
  }
};

export interface SystemFeature {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'inactive' | 'maintenance' | 'critical' | 'degraded';
  category: 'client_app' | 'business_platform' | 'developer_platform';
  load: number; // 0-100%
  dependencies: string[];
  lastUpdated: string;
  errorRate: number; // 0-100%
  version: string;
}

import api from '../api';

export const adminFeaturesApi = {
  getFeatures: async (): Promise<SystemFeature[]> => {
    const res = await api.get('/system/features');
    return res.data || [];
  },

  updateFeature: async (id: string, updates: Partial<SystemFeature>) => {
    const res = await api.patch(`/system/features/${id}`, updates);
    return res.data;
  }
};

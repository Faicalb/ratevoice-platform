import api from '../api';

export interface ExternalApi {
  id: string;
  serviceName: string;
  providerName: string;
  apiKey: string;
  endpoint?: string;
  priority: number;
  rateLimit: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  healthStatus: string;
  currentLatency: number;
  failureCount: number;
  costPerUnit: number;
  fallbackProviderId?: string;
  fallbackProvider?: { id: string; providerName: string };
  // UI helpers
  lastRequest?: string;
  errorRate?: number;
  responseTime?: number;
  health?: string;
  name?: string;
  environment?: string;
}

export const adminGatewayApi = {
  getDashboard: async () => {
    const response = await api.get('/admin/providers/dashboard');
    return response.data;
  },

  getOptimization: async () => {
    const response = await api.get('/admin/providers/optimize');
    return response.data;
  },

  getApis: async (): Promise<ExternalApi[]> => {
    const response = await api.get('/admin/providers');
    return response.data.map((p: any) => ({
      ...p,
      // Map legacy/UI fields
      name: p.serviceName,
      provider: p.providerName,
      environment: 'production',
      status: p.isActive ? 'active' : 'disabled',
      health: p.healthStatus?.toLowerCase() || 'unknown',
      responseTime: p.currentLatency || 0,
      errorRate: 0, // Need metric aggregation for this
      lastRequest: p.lastHealthCheck || new Date().toISOString()
    }));
  },

  addApi: async (data: any) => {
    const dto = {
      serviceName: data.category || 'AI',
      providerName: data.provider,
      apiKey: data.key,
      endpoint: data.endpoint,
      fallbackProviderId: data.fallbackProviderId,
      costPerUnit: Number(data.cost) || 0
    };
    return api.post('/admin/providers', dto);
  },

  testConnection: async (id: string) => {
    const response = await api.post(`/admin/providers/test/${id}`);
    return response.data;
  },

  updateApiStatus: async (id: string, status: 'active' | 'disabled') => {
    return api.patch(`/admin/providers/${id}`, { 
        isActive: status === 'active',
        status: status === 'active' ? 'ACTIVE' : 'INACTIVE'
    });
  }
};


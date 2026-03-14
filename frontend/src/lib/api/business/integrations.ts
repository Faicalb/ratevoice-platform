import api from '../api';

export interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSync: string;
  config?: any;
}

export interface ICalImport {
  id: string;
  name: string;
  url: string;
  frequency: string;
  status: string;
  lastSync: string;
  totalEvents: number;
}

export interface SyncLog {
  id: string;
  platform: string;
  status: string;
  imported: number;
  errors: number;
  timestamp: string;
  latency: number;
}

export const integrationsApi = {
  getChannels: async (): Promise<Channel[]> => {
    const res = await api.get('/business/integrations/channels');
    return res.data;
  },

  getICals: async (): Promise<ICalImport[]> => {
    const res = await api.get('/business/integrations/icals');
    return res.data;
  },

  getSyncLogs: async (): Promise<SyncLog[]> => {
    const res = await api.get('/business/integrations/logs');
    return res.data;
  },

  addChannel: async (data: any) => {
    const res = await api.post('/business/integrations/channels', data);
    return res.data;
  },

  addICal: async (data: any) => {
    // Implement endpoint if needed or reuse channel endpoint with type
    return { success: true };
  },

  triggerSync: async (id: string) => {
    // Implement sync endpoint
    return { success: true };
  }
};

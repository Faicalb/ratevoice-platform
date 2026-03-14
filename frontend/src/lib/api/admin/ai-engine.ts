import api from '../api';

export interface AISettings {
  sensitivity: number;
  voiceEnabled: boolean;
  models: {
    sentiment: string;
    image: string;
    recommendation: string;
  };
  usage: {
    dailyRequests: number;
    cost: number;
    errorRate: number;
  };
}

export async function getAISettings(): Promise<AISettings> {
  const res = await api.get('/system/ai-settings');
  const s = res.data || {};
  return {
    sensitivity: Number(s.sensitivity || 0),
    voiceEnabled: !!s.voiceEnabled,
    models: {
      sentiment: s.models?.sentiment || 'default',
      image: s.models?.image || 'default',
      recommendation: s.models?.recommendation || 'default'
    },
    usage: {
      dailyRequests: Number(s.usage?.dailyRequests || 0),
      cost: Number(s.usage?.cost || 0),
      errorRate: Number(s.usage?.errorRate || 0)
    }
  };
}

export async function updateAISettings(settings: Partial<AISettings>): Promise<void> {
  await api.patch('/system/ai-settings', settings);
}

export interface AiInsight {
  id: string;
  category: 'demand' | 'trend' | 'marketing';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  action?: string;
}

export interface Prediction {
  date: string;
  value: number;
  type: 'booking' | 'revenue';
}

import api from './api';

export const aiEngineApi = {
  getInsights: async (): Promise<AiInsight[]> => {
    const res = await api.get('/ai-analytics/data-wall');
    const alerts = res.data?.alerts || [];
    return alerts.map((a: any) => ({
      id: a.id,
      category: 'trend',
      title: a.title,
      description: a.message,
      confidence: 70,
      impact: a.type === 'CRITICAL' ? 'high' : a.type === 'WARNING' ? 'medium' : 'low',
      action: ''
    }));
  },

  getPredictions: async (): Promise<Prediction[]> => {
    const res = await api.get('/ai-analytics/data-wall');
    const trend = res.data?.revenue?.trend || [];
    return (trend as any[]).map((v, idx) => ({
      date: String(idx + 1),
      value: Number(v || 0),
      type: 'revenue'
    }));
  }
};

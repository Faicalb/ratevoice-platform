import api from './api';

export interface MarketInsight {
  id: string;
  query: string;
  summary: string;
  trend: 'up' | 'down' | 'stable';
  competitionLevel: 'Low' | 'Medium' | 'High';
  demandLevel: 'Low' | 'Medium' | 'High';
  dataPoints: Array<{ label: string; value: number }>;
  recommendations: string[];
  opportunities: Array<{ title: string; description: string; type: 'gap' | 'trend' }>;
  heatmapData: Array<{ x: number; y: number; z: number; name: string }>; // x,y = coords, z = intensity
  competitionBreakdown: Array<{ name: string; saturation: number; rating: number }>;
}

export const marketApi = {
  searchMarket: async (query: string): Promise<MarketInsight> => {
    const res = await api.get('/business/market/search', { params: { query } });
    return res.data;
  }
};

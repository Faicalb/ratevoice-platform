export interface AIAnalysisData {
  emotionScore: number; // 0-100
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    surprise: number;
  };
  keywords: Array<{ text: string; count: number; sentiment: 'positive' | 'negative' | 'neutral' }>;
  complaints: Array<{
    id: string;
    text: string;
    severity: 'high' | 'medium' | 'low';
    status: 'open' | 'resolved';
  }>;
}

import api from './api';

export const aiApi = {
  getAnalysis: async (): Promise<AIAnalysisData> => {
    const res = await api.get('/ai-analytics/comment-analysis');
    return res.data;
  }
};

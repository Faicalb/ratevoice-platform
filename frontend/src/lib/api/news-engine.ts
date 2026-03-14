import api from './api';

export interface NewsEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  category: 'festival' | 'concert' | 'food_event' | 'sports_event' | 'tourism_news' | 'hotel_opening' | 'restaurant_opening' | 'travel_alert';
  imageUrl?: string;
  source: string;
  eventDate?: string;
  isEvent: boolean;
  isNews: boolean;
  createdAt: string;
  status: 'published' | 'draft' | 'archived';
}

export const newsEngine = {
  fetchLatest: async (filters?: { city?: string; country?: string; type?: 'news' | 'event' }): Promise<NewsEvent[]> => {
    const res = await api.get('/business/news-events', { params: filters || {} });
    return res.data || [];
  },

  triggerEngineUpdate: async (): Promise<{ newItems: number; source: string }[]> => {
    const res = await api.post('/admin/news-events/refresh', {});
    const sources = res.data?.sources || [];
    return sources.map((s: any) => ({ newItems: Number(s.newItems || 0), source: String(s.source || '') }));
  },

  create: async (data: Partial<NewsEvent>) => {
    const res = await api.post('/business/news-events', data);
    return res.data;
  }
};

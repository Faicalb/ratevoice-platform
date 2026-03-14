import api from './api';

export interface Competitor {
  id: string;
  name: string;
  type: 'Hotel' | 'Restaurant' | 'Cafe' | 'Attraction';
  city: string;
  address: string;
  website?: string;
  googleMapsUrl?: string;
  rating: number;
  reviews: number;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  distance: string;
  coordinates: { lat: number; lng: number };
  strengths: string[];
  weaknesses: string[];
  sentiment: {
    positive: string[];
    negative: string[];
  };
  marketPosition: string;
}

export interface CompetitorInsight {
  marketPosition: string;
  averageRating: number;
  yourRating: number;
  advantage: string;
  opportunity: string;
  strategies: string[];
}

export const competitorApi = {
  getCompetitors: async (): Promise<Competitor[]> => {
    const res = await api.get('/competitors');
    return (res.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: 'Hotel',
      city: '',
      address: '',
      website: c.website || '',
      googleMapsUrl: '',
      rating: 0,
      reviews: 0,
      priceLevel: '$$',
      distance: '',
      coordinates: { lat: 0, lng: 0 },
      strengths: [],
      weaknesses: [],
      sentiment: { positive: [], negative: [] },
      marketPosition: ''
    }));
  },

  addCompetitor: async (data: Partial<Competitor>): Promise<Competitor> => {
    const res = await api.post('/competitors', { name: data.name, website: data.website });
    return {
      id: res.data?.id,
      name: res.data?.name,
      type: 'Hotel',
      city: '',
      address: '',
      website: res.data?.website || '',
      rating: 0,
      reviews: 0,
      priceLevel: '$$',
      distance: '',
      coordinates: { lat: 0, lng: 0 },
      strengths: [],
      weaknesses: [],
      sentiment: { positive: [], negative: [] },
      marketPosition: ''
    } as Competitor;
  },

  deleteCompetitor: async (id: string): Promise<void> => {
    await api.delete(`/competitors/${id}`);
  },

  getNearbyCompetitors: async (radius: number): Promise<Competitor[]> => {
    return [];
  },

  getAiAnalysis: async (): Promise<CompetitorInsight> => {
    const res = await api.get('/ai-analytics/competitor-benchmark');
    return {
      marketPosition: '',
      averageRating: 0,
      yourRating: 0,
      advantage: '',
      opportunity: '',
      strategies: (res.data?.signals || []) as string[]
    };
  }
};

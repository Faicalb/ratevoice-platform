import api from '../api';

export interface DiscoveredBusiness {
  externalId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  rating: number;
  category: string;
  photos: any[];
  source: string;
}

export const globalDataApi = {
  discover: async (city: string, country: string, type: string, limit: number = 20): Promise<DiscoveredBusiness[]> => {
    const response = await api.post('/admin/global-data/discover', { city, country, type, limit });
    return response.data;
  },

  import: async (businesses: DiscoveredBusiness[]) => {
    const response = await api.post('/admin/global-data/import', { businesses });
    return response.data;
  }
};

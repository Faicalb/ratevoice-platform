import api from '../api';

export const reviewImportApi = {
  importForBusiness: async (businessId: string, limit: number = 20) => {
    const response = await api.post('/admin/review-import/business', { businessId, limit });
    return response.data;
  },

  importForCity: async (city: string, country: string, limit: number = 5) => {
    const response = await api.post('/admin/review-import/city', { city, country, limit });
    return response.data;
  }
};

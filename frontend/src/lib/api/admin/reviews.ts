import api from '../api';

export const adminReviewsApi = {
  getAllVoiceReviews: async () => {
    const response = await api.get('/admin/voice-reviews');
    return response.data;
  },

  deleteVoiceReview: async (id: string) => {
    const response = await api.delete(`/admin/voice-reviews/${id}`);
    return response.data;
  }
};

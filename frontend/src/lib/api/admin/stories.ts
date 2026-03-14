import api from '../api';

export const adminStoriesApi = {
  getAllStories: async () => {
    const res = await api.get('/admin/stories');
    return res.data;
  },
  getAllAds: async () => {
    const res = await api.get('/admin/stories/ads');
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    return api.patch(`/admin/stories/${id}/status`, { status });
  }
};

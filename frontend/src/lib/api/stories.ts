import api from './api';

export interface Story {
  id: string;
  mediaUrl: string;
  type: 'IMAGE' | 'VIDEO';
  views: number;
  expiresAt: string;
  status: string;
  aiScore?: number;
  duration?: number;
  createdAt?: string;
}

export const storiesApi = {
  getMyStories: async () => {
    const res = await api.get('/stories');
    return res.data;
  },
  createStory: async (data: any) => {
    return api.post('/stories', data);
  },
  deleteStory: async (id: string) => {
    return api.delete(`/stories/${id}`);
  },
  boostStory: async (id: string, data: any) => {
    return api.post(`/stories/${id}/boost`, data);
  }
};

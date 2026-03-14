import api from '../api';

export const adminChatApi = {
  getAllConversations: async () => {
    const response = await api.get('/admin/chats');
    return response.data;
  },

  getMessages: async (id: string) => {
    const response = await api.get(`/admin/chats/${id}`);
    return response.data;
  },

  deleteMessage: async (id: string) => {
    const response = await api.delete(`/admin/messages/${id}`);
    return response.data;
  },

  blockUser: async (messageId: string) => {
    const response = await api.post(`/admin/messages/${messageId}/block-user`);
    return response.data;
  }
};

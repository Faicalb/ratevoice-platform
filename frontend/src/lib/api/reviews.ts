import api from './api';

export interface VoiceReview {
  id: string;
  customerName: string;
  avatar?: string;
  rating: number;
  date: string;
  audioUrl: string;
  transcript: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  status: 'new' | 'replied' | 'flagged' | 'in_progress' | 'resolved' | 'archived';
  tags: string[];
  pinned?: boolean;
  assignedTo?: string;
  notes?: string[];
}

export const reviewsApi = {
  getReviews: async (branchId?: string): Promise<VoiceReview[]> => {
    // If branchId is provided, get reviews for that branch
    if (branchId) {
        const response = await api.get(`/reviews/business/${branchId}`);
        return response.data.map(mapReviewData);
    }
    // Otherwise get all reviews (admin/owner view)
    const response = await api.get('/reviews');
    // Backend returns { textReviews, voiceReviews }, we merge them or just return voice reviews based on usage
    return response.data.voiceReviews.map(mapReviewData);
  },
  
  reply: async (reviewId: string, message: string) => {
    const response = await api.post(`/reviews/${reviewId}/reply`, { message });
    return response.data;
  },
  
  replyVoice: async (reviewId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const response = await api.post(`/reviews/${reviewId}/reply-voice`, formData);
    return response.data;
  },

  reward: async (reviewId: string, type: 'cash' | 'points', amount: number, message: string) => {
    const response = await api.post(`/wallet/reward`, { reviewId, type, amount, message });
    return response.data;
  },

  shareInternal: async (reviewId: string, employeeId: string) => {
    const response = await api.post(`/reviews/${reviewId}/share`, { employeeId });
    return response.data;
  },

  shareWhatsapp: async (reviewId: string) => {
    // This might generate a link locally or via backend shortener
    return { success: true, link: `https://wa.me/?text=Check+this+review+${reviewId}` };
  },

  shareEmail: async (reviewId: string, email: string, subject: string, message: string) => {
    const response = await api.post(`/reviews/${reviewId}/share-email`, { email, subject, message });
    return response.data;
  },
  
  exportReviews: async (filters: any) => {
    const response = await api.get('/reviews/export', { params: filters, responseType: 'blob' });
    // Handle download logic in component or here
    return { success: true, url: URL.createObjectURL(response.data) };
  },

  updateStatus: async (reviewId: string, status: string) => {
    const response = await api.patch(`/reviews/${reviewId}/status`, { status });
    return response.data;
  },

  addNote: async (reviewId: string, note: string) => {
    const response = await api.post(`/reviews/${reviewId}/notes`, { note });
    return response.data;
  },

  assignStaff: async (reviewId: string, staffId: string) => {
    const response = await api.post(`/reviews/${reviewId}/assign`, { staffId });
    return response.data;
  },

  pinReview: async (reviewId: string, pinned: boolean) => {
    const response = await api.patch(`/reviews/${reviewId}/pin`, { pinned });
    return response.data;
  },

  flagReview: async (reviewId: string) => {
    const response = await api.post(`/reviews/${reviewId}/flag`);
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  }
};

// Helper to map backend data to frontend interface
function mapReviewData(data: any): VoiceReview {
    return {
        id: data.id,
        customerName: data.user?.fullName || 'Anonymous',
        avatar: data.user?.avatarUrl,
        rating: data.rating,
        date: data.createdAt,
        audioUrl: data.audioUrl,
        transcript: data.transcript || '',
        sentiment: (data.sentiment?.toLowerCase() as any) || 'neutral',
        status: (data.status?.toLowerCase() as any) || 'new',
        tags: data.tags || [],
        pinned: data.pinned,
        assignedTo: data.assignedTo,
        notes: data.notes
    };
}

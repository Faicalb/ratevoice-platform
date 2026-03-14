import api from './api';

export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  satisfactionScore: number;
  activeBookings: number;
  walletBalance: number;
  notifications: Array<{
    id: string;
    message: string;
    time: string;
    type: 'info' | 'warning' | 'success';
  }>;
  trends: {
    reviews: number;
    bookings: number;
    satisfaction: number;
  };
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    // Call real backend endpoint
    // return new Promise((resolve) => setTimeout(() => resolve({ ... }), 1000));
    const response = await api.get('/business/dashboard-stats');
    
    // Transform backend response to match UI interface if necessary
    // Backend returns { totalReviews, totalBookings, activeAds, recentReviews }
    // We might need to mock some fields until backend fully supports them (e.g., trends, notifications)
    const data = response.data;
    
    return {
      totalReviews: data.totalReviews,
      averageRating: 0, // Not yet in backend stats
      satisfactionScore: 0, // Not yet in backend stats
      activeBookings: data.totalBookings,
      walletBalance: 0, // Not yet in backend stats
      notifications: [], // Not yet in backend stats
      trends: {
        reviews: 0,
        bookings: 0,
        satisfaction: 0
      }
    };
  },
  
  getRecentActivity: async () => {
     const response = await api.get('/business/dashboard-stats');
     // Reuse recentReviews from dashboard-stats
     return response.data.recentReviews || [];
  },

  getTrends: async () => {
    const response = await api.get('/analytics/business/trends');
    return response.data;
  }
};

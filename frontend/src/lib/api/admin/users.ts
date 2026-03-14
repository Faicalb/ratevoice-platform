import api from '../api';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  role: 'user' | 'business_owner' | 'admin' | 'ambassador' | 'super_admin';
  membership: 'Free' | 'Silver' | 'Gold' | 'Platinum' | 'Titanium' | 'Diamond';
  points: number;
  walletBalance: number;
  status: 'active' | 'banned' | 'suspended' | 'pending_verification';
  lastLogin: string;
  registeredAt: string;
  reviewsCount: number;
  businessesInteracted: number;
  eliteProgress: number;
  device: string;
  avatarUrl?: string;
  reportsCount: number;
  messagesCount: number;
  bookingsCount: number;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  logs: Array<{
    id: string;
    action: string;
    adminId: string;
    timestamp: string;
    details: string;
  }>;
}

export const adminUserApi = {
  getUsers: async (skip = 0, take = 50): Promise<User[]> => {
    const response = await api.get('/admin/users', { params: { skip, take } });
    return response.data.map((user: any) => ({
      ...user,
      name: user.fullName || user.username || 'Unknown',
      role: user.roles?.[0]?.role?.name || 'user', // Use raw role name or normalize
      status: user.isActive ? 'active' : 'banned',
      registeredAt: user.createdAt,
      lastLogin: user.lastLoginAt || user.createdAt,
      // points: user.currentPoints || 0, // Now available on User
      // walletBalance: user.wallet?.balance || 0, // Now available on User via include
      membership: 'Free', // Still pending proper Elite Service integration
      reviewsCount: 0,
      businessesInteracted: 0,
      eliteProgress: 0,
      device: 'Unknown',
      reportsCount: 0,
      messagesCount: 0,
      bookingsCount: 0,
      verificationStatus: 'verified',
      logs: []
    }));
  },

  createUser: async (data: any) => {
    return api.post('/admin/users/create', data);
  },

  updateUser: async (id: string, data: any) => {
    return api.patch(`/admin/users/${id}`, data);
  },

  updateStatus: async (id: string, status: 'active' | 'banned' | 'suspended') => {
    if (status === 'banned') {
        return api.patch(`/admin/users/${id}/ban`);
    }
    return api.patch(`/admin/users/${id}`, { isActive: true });
  },

  updateRole: async (id: string, role: string) => {
    // Requires backend endpoint to manage roles
    return api.patch(`/admin/users/${id}`, { role });
  },

  updateMembership: async (id: string, level: string) => {
    // Requires backend endpoint
    return api.patch(`/admin/users/${id}`, { membership: level });
  },

  updatePoints: async (id: string, points: number, type: 'add' | 'deduct' | 'reset', reason: string) => {
    return api.post(`/admin/users/${id}/reward`, { amount: type === 'deduct' ? -points : points, reason });
  },

  deleteUser: async (id: string) => {
    return api.delete(`/admin/users/${id}`);
  }
};

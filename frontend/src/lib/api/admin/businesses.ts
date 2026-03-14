import api from '../api';

export interface Business {
  id: string;
  name: string;
  type: string;
  owner: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  verificationStatus: 'verified' | 'unverified' | 'rejected';
  registeredAt: string;
  location: string;
  cooperationScore: number;
  cooperationLevel: 'excellent' | 'average' | 'poor';
  walletBalance: number;
  lastLogin: string;
  activeSessions: number;
  systemToken: string;
  certificateStatus: 'valid' | 'expired' | 'missing';
  cooperationOverride?: boolean;
  // AI Email Finder
  ownerEmailFound: boolean;
  discoveredEmail: string;
  emailConfidenceScore: number;
  emailSource: string;
}

export const adminBusinessApi = {
  getBusinesses: async (skip = 0, take = 50): Promise<Business[]> => {
    const response = await api.get('/admin/businesses', { params: { skip, take } });
    return response.data.map((biz: any) => ({
      id: biz.id,
      name: biz.name,
      type: biz.category || 'Business',
      owner: biz.owner?.fullName || 'Unknown',
      email: biz.owner?.email || '',
      status: biz.status.toLowerCase(),
      verificationStatus: biz.isVerified ? 'verified' : 'unverified',
      registeredAt: biz.createdAt,
      location: biz.address || 'Unknown',
      cooperationScore: 50, // Mock for now
      cooperationLevel: 'average', // Mock for now
      walletBalance: 0, // Mock for now
      lastLogin: biz.updatedAt,
      activeSessions: 0,
      systemToken: 'N/A',
      certificateStatus: 'missing',
      cooperationOverride: false,
      ownerEmailFound: biz.ownerEmailFound || false,
      discoveredEmail: biz.discoveredEmail || '',
      emailConfidenceScore: biz.emailConfidenceScore || 0,
      emailSource: biz.emailSource || ''
    }));
  },

  updateCooperationLevel: async (id: string, level: 'excellent' | 'average' | 'poor' | 'reset') => {
    // Requires backend logic for cooperation level
    return api.patch(`/admin/businesses/${id}/cooperation`, { level });
  },

  updateStatus: async (id: string, status: 'active' | 'suspended') => {
    return api.patch(`/admin/businesses/${id}/status`, { status });
  },

  verifyBusiness: async (id: string) => {
    return api.patch(`/admin/businesses/${id}/verification`, { verified: true });
  },

  deleteBusiness: async (id: string) => {
    return api.delete(`/admin/businesses/${id}`);
  },
  
  getBusinessDetails: async (id: string): Promise<Business> => {
      // In a real app, GET /admin/businesses/:id
      const list = await adminBusinessApi.getBusinesses();
      return list.find(b => b.id === id) as Business;
  },

  // --- AI BUSINESS CREATION ---
  searchPlaces: async (query: string) => {
    const response = await api.get('/admin/business/search-places', { params: { query } });
    return response.data;
  },

  detectDuplicates: async (name: string, lat: number, lng: number) => {
    const response = await api.get('/admin/business/detect-duplicates', { params: { name, lat, lng } });
    return response.data;
  },

  createBusinessManual: async (data: any) => {
    const response = await api.post('/admin/business/create-manual', data);
    return response.data;
  },

  findOwnerEmail: async (id: string) => {
    const response = await api.post(`/admin/business/find-email/${id}`);
    return response.data;
  },

  bulkFindEmail: async () => {
    const response = await api.post('/admin/business/bulk-find-email');
    return response.data;
  }
};

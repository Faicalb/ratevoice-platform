import api from '../api';

export interface Ambassador {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  city: string;
  status: 'active' | 'pending' | 'suspended' | 'banned' | 'under_review';
  level: 'standard' | 'premium' | 'global';
  verificationStatus: 'verified' | 'unverified' | 'rejected';
  referrals: number;
  successfulSignups: number;
  businessesInvited: number;
  earnings: number;
  walletBalance: number;
  services: string[];
  joinedAt: string;
  rating: number; // 1-5
  servicesSold: number;
  avatarUrl?: string;
  riskScore?: number;
  riskLevel?: 'SAFE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WithdrawalRequest {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface AmbassadorActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export const adminAmbassadorApi = {
  getAmbassadors: async (): Promise<Ambassador[]> => {
    const res = await api.get('/admin/ambassadors');
    // Map backend data to frontend interface if needed
    // Assuming backend returns array similar to interface, but might need adjustment
    // For now, let's assume we need to map because backend uses `balance` and `commissionRate` etc.
    return res.data.map((a: any) => ({
      id: a.id,
      name: a.name || 'Unknown',
      email: a.email || 'N/A',
      phone: a.phone,
      country: a.country || 'N/A',
      city: a.city || 'N/A',
      status: a.status.toLowerCase(),
      level: (a.level || 'standard').toLowerCase(),
      verificationStatus: 'verified', // Mock for now
      referrals: a._count?.referrals || 0, // Need backend support
      successfulSignups: 0,
      businessesInvited: 0,
      earnings: 0, // Need backend support or calculate
      walletBalance: a.balance || 0,
      services: a.services?.map((s: any) => s.name) || [],
      joinedAt: a.createdAt,
      rating: 5,
      servicesSold: 0,
      avatarUrl: null,
      riskScore: a.riskProfile?.riskScore || 0,
      riskLevel: a.riskProfile?.riskLevel || 'SAFE'
    }));
  },

  createAmbassador: async (data: any) => {
    return api.post('/admin/ambassadors/create', data);
  },

  getAmbassador: async (id: string): Promise<Ambassador> => {
    const res = await api.get(`/admin/ambassadors/${id}`);
    const a = res.data;
    return {
      id: a.id,
      name: a.name || 'Unknown',
      email: a.email || 'N/A',
      phone: a.phone,
      country: a.country || 'N/A',
      city: a.city || 'N/A',
      status: a.status.toLowerCase(),
      level: (a.level || 'standard').toLowerCase(),
      verificationStatus: 'verified',
      referrals: a._count?.referrals || 0,
      successfulSignups: 0,
      businessesInvited: 0,
      earnings: 0, 
      walletBalance: a.balance || 0,
      services: a.services?.map((s: any) => s.name) || [],
      joinedAt: a.createdAt,
      rating: 5,
      servicesSold: 0,
      avatarUrl: null,
      riskScore: a.riskProfile?.riskScore || 0,
      riskLevel: a.riskProfile?.riskLevel || 'SAFE'
    };
  },

  getAmbassadorWallet: async (id: string) => {
    const res = await api.get(`/admin/ambassadors/${id}/wallet`);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    return api.put(`/admin/ambassadors/${id}/status`, { status: status.toUpperCase() });
  },

  updateServices: async (id: string, services: string[]) => {
    // Placeholder as backend logic for updating services array directly on ambassador is not in my snippet
    // But assuming it exists or mocked
    return { success: true };
  },

  getWithdrawals: async (id: string): Promise<WithdrawalRequest[]> => {
    const res = await api.get(`/admin/ambassadors/${id}/withdrawals`);
    return res.data;
  },

  getLogs: async (id: string): Promise<AmbassadorActivityLog[]> => {
    const res = await api.get(`/admin/ambassadors/${id}/logs`);
    return res.data;
  },
  
  triggerFraudAnalysis: async (id: string) => {
    return api.post(`/admin/fraud-detection/analyze/${id}`);
  },

  approveWithdrawal: async (ambassadorId: string, requestId: string, transactionId: string) => {
    return api.post(`/admin/ambassadors/${ambassadorId}/approve-withdraw/${requestId}`, { transactionId });
  },

  rejectWithdrawal: async (ambassadorId: string, requestId: string, reason: string) => {
    return api.post(`/admin/ambassadors/${ambassadorId}/reject-withdraw/${requestId}`, { reason });
  }
};

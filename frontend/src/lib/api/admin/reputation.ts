export interface ReputationOverride {
  id: string;
  businessName: string;
  originalScore: number;
  overrideScore: number;
  reason: string;
  status: 'active' | 'expired';
  updatedAt: string;
}

export const adminReputationApi = {
  getOverrides: async (): Promise<ReputationOverride[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([
      {
        id: 'REP-001',
        businessName: 'Grand Hotel Paris',
        originalScore: 8.2,
        overrideScore: 9.0,
        reason: 'VIP Partner Adjustment',
        status: 'active',
        updatedAt: '2024-03-15'
      },
      {
        id: 'REP-002',
        businessName: 'Luigi\'s Pizzeria',
        originalScore: 4.5,
        overrideScore: 7.0,
        reason: 'System Error Correction',
        status: 'expired',
        updatedAt: '2024-02-10'
      }
    ]), 1000));
  },

  applyOverride: async (businessId: string, score: number, reason: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  }
};

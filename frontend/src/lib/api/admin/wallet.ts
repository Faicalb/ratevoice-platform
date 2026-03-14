import api from '../api';

export interface WalletTransaction {
  id: string;
  user: string;
  userId?: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  riskScore: number;
  fraudFlag?: boolean;
  provider?: string | null;
  providerRefId?: string | null;
  referenceId?: string | null;
}

export type PaymentProviderKey = 'STRIPE' | 'PAYPAL' | 'CMI' | 'BANK_TRANSFER';

export type PaymentSetting = {
  id?: string;
  provider: PaymentProviderKey;
  enabled: boolean;
  priority: number;
  config: Record<string, any>;
};

export type AdminFinancialLog = {
  id: string;
  adminId: string;
  actionType: string;
  targetUserId: string | null;
  amount: number | null;
  currency: string | null;
  reason: string | null;
  transactionId: string | null;
  createdAt: string;
};

export const adminWalletApi = {
  getTransactions: async (): Promise<WalletTransaction[]> => {
    const res = await api.get('/admin/wallet/transactions');
    return res.data.map((t: any) => ({
      id: t.id,
      user: t.wallet?.user?.fullName || t.wallet?.user?.email || 'Unknown',
      userId: t.wallet?.user?.id,
      type: String(t.type || '').toUpperCase(),
      amount: Number(t.amount),
      status: String(t.status || '').toUpperCase(),
      date: t.createdAt,
      riskScore: t.riskScore || 0,
      fraudFlag: t.fraudFlag,
      provider: t.provider || null,
      providerRefId: t.providerRefId || null,
      referenceId: t.referenceId || null
    }));
  },

  getStats: async () => {
    const res = await api.get('/admin/wallet/stats');
    return res.data;
  },

  adjustBalance: async (userId: string, amount: number, reason: string) => {
    return api.post('/admin/wallet/adjust-balance', { userId, amount, reason });
  },

  updateTransactionStatus: async (id: string, status: string) => {
    if (status === 'completed' || status === 'COMPLETED') {
        return api.patch(`/admin/wallet/transactions/${id}/approve`);
    }
    if (status === 'rejected' || status === 'failed' || status === 'REJECTED' || status === 'FAILED') {
        return api.patch(`/admin/wallet/transactions/${id}/reject`, { reason: 'Admin action' });
    }
    return api.patch(`/admin/wallet/transactions/${id}/flag`);
  },

  adminTransfer: async (fromUserId: string, toUserId: string, amount: number, reason: string) => {
    return api.post('/admin/wallet/transfer', { fromUserId, toUserId, amount, reason });
  },

  getPaymentSettings: async (): Promise<PaymentSetting[]> => {
    const res = await api.get('/admin/wallet/payment-settings');
    return (res.data || []).map((r: any) => {
      const cfg = r.config || {};
      const { provider, ...rest } = cfg;
      return {
        id: r.id,
        provider: r.provider,
        enabled: !!r.enabled,
        priority: Number(r.priority || 100),
        config: rest
      };
    });
  },

  savePaymentSettings: async (settings: PaymentSetting[]) => {
    return api.put('/admin/wallet/payment-settings', settings);
  },

  getFinancialLogs: async (): Promise<AdminFinancialLog[]> => {
    const res = await api.get('/admin/wallet/financial-logs', { params: { take: 50 } });
    return (res.data || []).map((r: any) => ({
      id: r.id,
      adminId: r.adminId,
      actionType: r.actionType,
      targetUserId: r.targetUserId,
      amount: r.amount == null ? null : Number(r.amount),
      currency: r.currency,
      reason: r.reason,
      transactionId: r.transactionId,
      createdAt: r.createdAt
    }));
  }
};

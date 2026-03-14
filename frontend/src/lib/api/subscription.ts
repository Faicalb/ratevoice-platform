export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  isCurrent: boolean;
  recommended?: boolean;
}

export interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  invoiceUrl: string;
}

import api from './api';

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const [plansRes, subRes] = await Promise.all([
      api.get('/business/subscription/plans'),
      api.get('/business/subscription')
    ]);

    const currentPlanId = subRes.data?.subscription?.plan?.code || subRes.data?.subscription?.plan?.id || null;

    return (plansRes.data || []).map((p: any) => {
      const features = (() => {
        try {
          const parsed = JSON.parse(p.featuresJson || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();
      const interval = String(p.interval || 'MONTHLY').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
      return {
        id: p.code || p.id,
        name: p.name,
        price: Number(p.price || 0),
        interval,
        features,
        isCurrent: (p.code || p.id) === currentPlanId,
        recommended: false
      } as SubscriptionPlan;
    });
  },

  getBillingHistory: async (): Promise<BillingHistory[]> => {
    const res = await api.get('/business/subscription/billing-history');
    return (res.data || []).map((i: any) => ({
      id: i.id,
      date: i.createdAt,
      amount: Number(i.amount || 0),
      status: String(i.status || 'PENDING').toLowerCase(),
      invoiceUrl: i.invoiceUrl || ''
    }));
  },

  upgradePlan: async (planId: string) => {
    const res = await api.post('/business/subscription/subscribe', { planCode: planId });
    return res.data;
  }
};

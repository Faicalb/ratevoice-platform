import api from './api';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: 'deposit' | 'withdrawal' | 'reward' | 'purchase' | 'fee';
  amount: number;
  currency: string;
  description: string;
  date: string;
  recipient?: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  invoiceUrl?: string;
}

export interface WalletData {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  currency: string;
  history: Transaction[];
  cards: { id: string; last4: string; brand: string; expiry: string }[];
  bankAccounts: { id: string; name: string; accountNumber: string; bankName: string }[];
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'due' | 'overdue';
  downloadUrl: string;
}

export const walletApi = {
  getWalletData: async (): Promise<WalletData> => {
    const [walletRes, historyRes] = await Promise.all([api.get('/wallet'), api.get('/wallet/history')]);
    const wallet = walletRes.data || {};
    const historyRows = historyRes.data || [];

    const history: Transaction[] = historyRows.map((t: any) => {
      const amount = Number(t.amount || 0);
      const type = amount >= 0 ? 'credit' : 'debit';
      const category = String(t.type || '').toLowerCase() === 'deposit' ? 'deposit' : String(t.type || '').toLowerCase() === 'withdrawal' ? 'withdrawal' : String(t.type || '').toLowerCase() === 'reward' ? 'reward' : 'purchase';
      return {
        id: t.id,
        type,
        category: category as any,
        amount: Math.abs(amount),
        currency: t.currency || wallet.currency || 'USD',
        description: t.type || 'Transaction',
        date: t.createdAt,
        recipient: t.referenceId || undefined,
        status: String(t.status || 'COMPLETED').toLowerCase() as any,
        invoiceUrl: ''
      };
    });

    const totalEarned = history.filter((h) => h.type === 'credit').reduce((acc, h) => acc + h.amount, 0);
    const totalSpent = history.filter((h) => h.type === 'debit').reduce((acc, h) => acc + h.amount, 0);

    return {
      balance: Number(wallet.balance || 0),
      pendingBalance: 0,
      totalEarned,
      totalSpent,
      currency: wallet.currency || 'USD',
      history,
      cards: [],
      bankAccounts: []
    };
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const res = await api.get('/business/subscription/billing-history');
    return (res.data || []).map((i: any) => ({
      id: i.id,
      number: i.id,
      date: i.createdAt,
      amount: Number(i.amount || 0),
      status: String(i.status || 'PENDING').toLowerCase() === 'paid' ? 'paid' : 'due',
      downloadUrl: i.invoiceUrl || ''
    }));
  },

  compensate: async (customerId: string, amount: number, reason: string) => {
    const res = await api.post('/wallet/compensate', { userId: customerId, amount, reason });
    return res.data;
  }
};

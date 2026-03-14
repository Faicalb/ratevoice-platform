import api from '../api';

export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  logo: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  loginHistory: { date: string; ip: string; device: string }[];
}

export interface NotificationSettings {
  email: {
    marketing: boolean;
    security: boolean;
    updates: boolean;
  };
  push: {
    newReview: boolean;
    newBooking: boolean;
    mentions: boolean;
  };
}

export interface Preferences {
  language: string;
  currency: string;
  timezone: string;
  dashboardTheme?: string;
  autoTheme?: boolean;
  brandColor?: string;
  brandStyle?: 'soft' | 'flat' | 'glass';
}

export interface TeamMemberPermissions {
  viewReviews: boolean;
  replyReviews: boolean;
  manageBookings: boolean;
  accessAnalytics: boolean;
  manageAds: boolean;
  accessWallet: boolean;
  sendRewards: boolean;
  accessReports: boolean;
  manageStaff: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  role: 'Owner' | 'Manager' | 'Reply Manager' | 'Data Analyst' | 'Marketing Manager' | 'Customer Support';
  status: 'Active' | 'Invited';
  accessScope: 'Full Access' | 'Limited Access' | 'Read Only';
  permissions: TeamMemberPermissions;
  security: {
    require2FA: boolean;
    forcePasswordReset: boolean;
    sessionTimeout: boolean;
  };
}

export interface WalletSettings {
  payoutMethod: 'Bank Transfer' | 'PayPal' | 'Stripe';
  accountNumber: string;
  autoPayout: boolean;
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  icon: string;
}

export const defaultPermissions: TeamMemberPermissions = {
  viewReviews: true,
  replyReviews: false,
  manageBookings: false,
  accessAnalytics: false,
  manageAds: false,
  accessWallet: false,
  sendRewards: false,
  accessReports: false,
  manageStaff: false,
};

export const getSettings = async () => {
  const res = await api.get('/business/settings');
  return res.data;
};

export const updateSettings = async (section: string, data: any) => {
  const res = await api.patch(`/business/settings/${section}`, data);
  return res.data;
};

export const addMember = async (member: Omit<TeamMember, 'id'>) => {
  const permissions = Object.entries(member.permissions || {}).map(([key, enabled]) => ({
    key: key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`),
    enabled: !!enabled
  }));
  const res = await api.post('/business/employees', {
    email: member.email,
    name: member.name,
    phone: member.phone,
    roleTitle: member.role,
    permissions
  });
  return { ...member, id: res.data?.employeeId || '' };
};

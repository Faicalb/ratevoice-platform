import api from '../api';

export interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'login' | 'transaction' | 'api' | 'content';
  description: string;
  source: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
}

export interface BusinessSecurityStatus {
  id: string;
  businessName: string;
  token: string;
  registrationDate: string;
  certificateStatus: 'Pending' | 'Generated' | 'Sent' | 'Revoked';
  deviceStatus: 'Pending' | 'Verified';
  activationStatus: 'Pending' | 'Activated' | 'Suspended';
  certificateId?: string;
  deviceFingerprint?: string;
}

export const adminSecurityApi = {
  getAlerts: async (): Promise<SecurityAlert[]> => {
    const res = await api.get('/admin/security/alerts');
    return (res.data || []).map((a: any) => ({
      id: a.id,
      severity: String(a.severity || 'MEDIUM').toLowerCase(),
      type: a.type,
      description: a.description,
      source: a.source || '',
      timestamp: a.createdAt,
      status: String(a.status || 'NEW').toLowerCase()
    }));
  },

  updateStatus: async (id: string, status: 'investigating' | 'resolved') => {
    const mapped = status === 'resolved' ? 'RESOLVED' : 'INVESTIGATING';
    await api.patch(`/admin/security/alerts/${id}/status`, { status: mapped });
    return { success: true };
  },

  getBusinessSecurity: async (): Promise<BusinessSecurityStatus[]> => {
    const res = await api.get('/admin/security/business-status');
    return res.data || [];
  },

  generateCertificate: async (businessId: string) => {
    const res = await api.post(`/admin/security/business/${businessId}/generate-certificate`, {});
    return { success: true, certificateId: res.data?.certificateId };
  },

  activateBusiness: async (businessId: string) => {
    await api.post(`/admin/security/business/${businessId}/activate`, {});
    return { success: true };
  },

  suspendBusiness: async (businessId: string) => {
    await api.post(`/admin/security/business/${businessId}/suspend`, {});
    return { success: true };
  },

  revokeCertificate: async (businessId: string) => {
    await api.post(`/admin/security/business/${businessId}/revoke-certificate`, {});
    return { success: true };
  }
};

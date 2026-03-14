import api from './api';

export type RoleType = 'Manager' | 'Customer Support' | 'Review Manager' | 'Marketing Manager' | 'Data Analyst' | 'Reservation Manager';

export interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: RoleType;
  department?: string;
  permissions: Permission[];
  status: 'active' | 'suspended' | 'pending' | 'removed';
  lastActive: string;
  createdAt: string;
  mustChangePassword?: boolean;
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

const defaultPermissions: Permission[] = [
  { id: 'view_reviews', name: 'View Reviews', description: 'Can view customer reviews', enabled: true },
  { id: 'reply_reviews', name: 'Reply to Reviews', description: 'Can post replies to reviews', enabled: false },
  { id: 'manage_promotions', name: 'Manage Promotions', description: 'Can create and edit ads', enabled: false },
  { id: 'view_analytics', name: 'View Analytics', description: 'Access to dashboard statistics', enabled: false },
  { id: 'manage_wallet', name: 'Manage Wallet', description: 'Can add funds and withdraw', enabled: false },
  { id: 'manage_staff', name: 'Manage Staff', description: 'Can invite and remove employees', enabled: false },
];

export const employeesApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const res = await api.get('/business/employees');
    return (res.data || []).map((e: any) => {
      const user = e.user || {};
      const permsMap = new Map<string, boolean>((e.permissions || []).map((p: any) => [p.key, !!p.enabled]));
      const perms = defaultPermissions.map((p) => ({ ...p, enabled: permsMap.get(p.id) ?? false }));
      const role = (e.roleTitle as RoleType) || 'Manager';
      const status = String(e.status || 'INVITED').toLowerCase();
      return {
        id: e.id,
        name: user.fullName || '',
        email: user.email,
        phone: user.phoneNumber || '',
        role,
        department: '',
        permissions: perms,
        status: status === 'active' ? 'active' : status === 'suspended' ? 'suspended' : status === 'removed' ? 'removed' : 'pending',
        lastActive: '',
        createdAt: e.createdAt || '',
        mustChangePassword: !!user.mustChangePassword
      } as Employee;
    });
  },

  createEmployee: async (data: Partial<Employee> & { password?: string }, method: 'email' | 'whatsapp'): Promise<{ success: boolean; tempPass: string }> => {
    const permissions = (data.permissions || []).map((p) => ({ key: p.id, enabled: !!p.enabled }));
    const res = await api.post('/business/employees', {
      email: data.email,
      name: data.name,
      phone: data.phone,
      department: data.department,
      roleTitle: data.role,
      password: data.password,
      permissions,
      inviteMethod: method
    });
    return { success: true, tempPass: res.data?.tempPassword || '' };
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    const permissions = data.permissions ? data.permissions.map((p) => ({ key: p.id, enabled: !!p.enabled })) : undefined;
    await api.patch(`/business/employees/${id}`, {
      roleTitle: data.role,
      status: data.status ? data.status.toUpperCase() : undefined,
      permissions
    });
    return { success: true };
  },

  deleteEmployee: async (id: string) => {
    await api.delete(`/business/employees/${id}`);
    return { success: true };
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const res = await api.get('/business/employees/activity');
    return res.data || [];
  },
  
  getPermissionsForRole: (role: RoleType): Permission[] => {
    const perms = JSON.parse(JSON.stringify(defaultPermissions)); // Deep copy
    
    switch (role) {
      case 'Manager':
        return perms.map((p: Permission) => ({ ...p, enabled: true }));
      case 'Customer Support':
        return perms.map((p: Permission) => ({ 
          ...p, 
          enabled: ['view_reviews', 'reply_reviews'].includes(p.id) 
        }));
      case 'Review Manager':
        return perms.map((p: Permission) => ({ 
          ...p, 
          enabled: ['view_reviews', 'reply_reviews', 'manage_promotions'].includes(p.id) 
        }));
      case 'Marketing Manager':
        return perms.map((p: Permission) => ({ 
          ...p, 
          enabled: ['manage_promotions', 'view_analytics'].includes(p.id) 
        }));
      case 'Data Analyst':
        return perms.map((p: Permission) => ({ 
          ...p, 
          enabled: ['view_analytics'].includes(p.id) 
        }));
      case 'Reservation Manager':
        return perms.map((p: Permission) => ({ 
          ...p, 
          enabled: ['view_reviews'].includes(p.id) 
        }));
      default:
        return perms;
    }
  }
};

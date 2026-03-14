export interface EliteMember {
  id: string;
  name: string;
  email: string;
  level: 'Silver' | 'Gold' | 'Platinum' | 'Titanium' | 'Diamond';
  status: 'active' | 'suspended';
  joinDate: string;
  points: number;
  totalSpent: number;
}

export const adminEliteApi = {
  getMembers: async (): Promise<EliteMember[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([
      {
        id: 'MEM-001',
        name: 'James Bond',
        email: '007@mi6.gov',
        level: 'Diamond',
        status: 'active',
        joinDate: '2023-01-01',
        points: 50000,
        totalSpent: 150000
      },
      {
        id: 'MEM-002',
        name: 'Tony Stark',
        email: 'tony@stark.com',
        level: 'Titanium',
        status: 'active',
        joinDate: '2023-05-12',
        points: 25000,
        totalSpent: 75000
      },
      {
        id: 'MEM-003',
        name: 'Bruce Wayne',
        email: 'bruce@wayne.com',
        level: 'Platinum',
        status: 'suspended',
        joinDate: '2024-02-20',
        points: 12000,
        totalSpent: 30000
      }
    ]), 1000));
  },

  updateLevel: async (id: string, level: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  },

  updateStatus: async (id: string, status: 'active' | 'suspended') => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  }
};

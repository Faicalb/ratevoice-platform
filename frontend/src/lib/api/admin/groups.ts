export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  posts: number;
  status: 'active' | 'suspended';
  createdAt: string;
  owner: string;
}

export const adminGroupApi = {
  getGroups: async (): Promise<Group[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([
      {
        id: 'GRP-001',
        name: 'Travel Enthusiasts Paris',
        description: 'Discussing the best spots in Paris.',
        members: 1250,
        posts: 5600,
        status: 'active',
        createdAt: '2023-09-01',
        owner: 'Jean Luc'
      },
      {
        id: 'GRP-002',
        name: 'Foodie Network',
        description: 'Sharing restaurant reviews and recipes.',
        members: 3400,
        posts: 12000,
        status: 'active',
        createdAt: '2023-06-15',
        owner: 'Maria Cook'
      },
      {
        id: 'GRP-003',
        name: 'Spam Group 101',
        description: 'Free crypto giveaway...',
        members: 5,
        posts: 20,
        status: 'suspended',
        createdAt: '2024-03-01',
        owner: 'Bot User'
      }
    ]), 1000));
  },

  updateStatus: async (id: string, status: 'active' | 'suspended') => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  },

  deleteGroup: async (id: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  },

  createGroup: async (data: Omit<Group, 'id' | 'members' | 'posts' | 'createdAt'>) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  }
};

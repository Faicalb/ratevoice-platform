export interface SystemReport {
  id: string;
  name: string;
  type: 'security' | 'performance' | 'financial' | 'audit';
  generatedAt: string;
  size: string;
  status: 'ready' | 'archived';
  downloads: number;
}

export const adminReportsApi = {
  getSystemReports: async (): Promise<SystemReport[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([
      {
        id: 'REP-SYS-001',
        name: 'Q1 Security Audit Log',
        type: 'security',
        generatedAt: '2024-04-01T08:00:00',
        size: '15.2 MB',
        status: 'ready',
        downloads: 5
      },
      {
        id: 'REP-SYS-002',
        name: 'Server Performance Metrics - March',
        type: 'performance',
        generatedAt: '2024-03-31T23:59:59',
        size: '8.4 MB',
        status: 'ready',
        downloads: 12
      },
      {
        id: 'REP-SYS-003',
        name: 'Platform Revenue Summary 2023',
        type: 'financial',
        generatedAt: '2024-01-15T10:00:00',
        size: '2.1 MB',
        status: 'archived',
        downloads: 3
      }
    ]), 1000));
  },

  generateReport: async (type: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 2000));
  }
};

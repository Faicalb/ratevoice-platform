export interface ReportFile {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'csv';
  category: 'financial' | 'operational' | 'reviews';
  dateRange: string;
  generatedAt: string;
  size: string;
  status: 'ready' | 'processing' | 'failed';
}

export const businessReportsApi = {
  getReports: async (): Promise<ReportFile[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([
      {
        id: 'REP-001',
        name: 'Monthly Financial Summary - Feb 2024',
        type: 'pdf',
        category: 'financial',
        dateRange: 'Feb 1 - Feb 29, 2024',
        generatedAt: '2024-03-01T10:00:00',
        size: '2.4 MB',
        status: 'ready'
      },
      {
        id: 'REP-002',
        name: 'Q1 Review Analysis',
        type: 'excel',
        category: 'reviews',
        dateRange: 'Jan 1 - Mar 31, 2024',
        generatedAt: '2024-04-01T09:30:00',
        size: '1.8 MB',
        status: 'ready'
      },
      {
        id: 'REP-003',
        name: 'Weekly Operations Log',
        type: 'csv',
        category: 'operational',
        dateRange: 'Mar 10 - Mar 17, 2024',
        generatedAt: '2024-03-18T08:00:00',
        size: '450 KB',
        status: 'ready'
      }
    ]), 1000));
  },

  generateReport: async (type: string, dateRange: { from: Date; to: Date }) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 2000));
  }
};

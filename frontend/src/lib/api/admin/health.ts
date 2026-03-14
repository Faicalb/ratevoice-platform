import api from '../api';

export interface SystemOverview {
  server: string;
  database: string;
  memory: string;
  cpu: string;
  requestsPerMinute: number;
  activeUsers: number;
  uptime: number;
}

export interface ApiPerformance {
  endpoint: string;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface SystemError {
  timestamp: string;
  endpoint: string;
  error: string;
  statusCode: number;
}

export interface SecurityThreats {
  suspiciousIPs: { ip: string; attempts: number }[];
  failedLoginAttempts: number;
  blockedRequests: number;
}

export interface UserActivity {
  activeUsersNow: number;
  newUsersToday: number;
  reviewsPostedToday: number;
}

export interface DatabaseHealth {
  connectionStatus: string;
  databaseSize: string;
  totalTables: number;
  slowQueries: number;
  missingIndexes: number;
  recordCounts: Record<string, number>;
}

export interface AIDevOpsInsight {
  status: string;
  insights: {
    severity: 'low' | 'warning' | 'critical' | 'info';
    issue: string;
    cause: string;
    suggestion: string;
  }[];
}

// Keeping legacy types for compatibility if needed, but we should migrate
export interface ServerStatus {
  id: string;
  name: string;
  region: string;
  uptime: number;
  status: 'operational' | 'degraded' | 'outage';
  latency: number;
  load: number;
}

export interface ApiMetric {
  time: string;
  requests: number;
  errors: number;
  latency: number;
}

export const adminHealthApi = {
  // Legacy method wrapper (mocking from new data)
  getStatus: async (): Promise<{ servers: ServerStatus[]; metrics: ApiMetric[] }> => {
    const overview = await adminHealthApi.getOverview();
    const perf = await adminHealthApi.getApiPerformance();
    
    // Map real data to legacy format for existing UI components until we replace them
    return {
      servers: [
        { 
            id: 'SRV-001', 
            name: 'Backend API', 
            region: 'Local', 
            uptime: 100, 
            status: overview.server === 'healthy' ? 'operational' : 'degraded', 
            latency: 20, 
            load: parseInt(overview.cpu) 
        },
        { 
            id: 'DB-001', 
            name: 'PostgreSQL', 
            region: 'Supabase', 
            uptime: 100, 
            status: overview.database === 'connected' ? 'operational' : 'outage', 
            latency: 50, 
            load: 40 
        }
      ],
      metrics: perf.map((p, i) => ({
          time: `10:0${i}`,
          requests: p.requests,
          errors: Math.floor(p.requests * p.errorRate),
          latency: p.avgResponseTime
      }))
    };
  },

  getOverview: async (): Promise<SystemOverview> => {
    const res = await api.get('/admin/system-health/overview');
    return res.data;
  },
  getApiPerformance: async (): Promise<ApiPerformance[]> => {
    const res = await api.get('/admin/system-health/api-performance');
    return res.data;
  },
  getErrors: async (): Promise<SystemError[]> => {
    const res = await api.get('/admin/system-health/errors');
    return res.data;
  },
  getSecurity: async (): Promise<SecurityThreats> => {
    const res = await api.get('/admin/system-health/security');
    return res.data;
  },
  getActivity: async (): Promise<UserActivity> => {
    const res = await api.get('/admin/system-health/activity');
    return res.data;
  },
  getDatabase: async (): Promise<DatabaseHealth> => {
    const res = await api.get('/admin/system-health/database');
    return res.data;
  },
  getAIInsights: async (): Promise<AIDevOpsInsight> => {
    const res = await api.get('/admin/system-health/ai-devops');
    return res.data;
  }
};

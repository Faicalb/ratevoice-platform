import { delay } from '../utils';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  environment: 'production' | 'sandbox';
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  scopes: ApiScope[];
  rateLimit: {
    requests: number;
    period: 'minute' | 'hour' | 'day';
  };
  ipWhitelist?: string[];
}

export type ApiScope = 
  | 'reviews:read' | 'reviews:write'
  | 'bookings:read' | 'bookings:write'
  | 'wallet:read' | 'wallet:write'
  | 'analytics:read'
  | 'messaging:read' | 'messaging:write'
  | 'ads:read' | 'ads:write'
  | 'ambassador:read' | 'ambassador:write';

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  latency: number;
  ip: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret: string;
}

const mockApiKeys: ApiKey[] = [
  {
    id: 'key_1',
    name: 'Production Server',
    key: 'pk_live_51M...xYz',
    environment: 'production',
    status: 'active',
    createdAt: '2023-10-24T10:00:00Z',
    lastUsed: '2024-03-15T14:30:00Z',
    scopes: ['reviews:read', 'bookings:read', 'analytics:read'],
    rateLimit: { requests: 1000, period: 'hour' },
    ipWhitelist: ['192.168.1.1']
  },
  {
    id: 'key_2',
    name: 'Dev Testing',
    key: 'pk_test_88A...bC2',
    environment: 'sandbox',
    status: 'active',
    createdAt: '2024-01-15T09:00:00Z',
    scopes: ['reviews:read', 'reviews:write', 'bookings:read', 'bookings:write'],
    rateLimit: { requests: 100, period: 'minute' }
  }
];

const mockLogs: ApiLog[] = [
  { id: 'log_1', timestamp: '2024-03-15T14:30:05Z', method: 'GET', endpoint: '/v1/reviews', status: 200, latency: 45, ip: '192.168.1.1' },
  { id: 'log_2', timestamp: '2024-03-15T14:31:12Z', method: 'POST', endpoint: '/v1/bookings', status: 201, latency: 120, ip: '192.168.1.1' },
  { id: 'log_3', timestamp: '2024-03-15T14:35:00Z', method: 'GET', endpoint: '/v1/analytics', status: 403, latency: 15, ip: '10.0.0.5' },
];

const mockWebhooks: Webhook[] = [
  { id: 'wh_1', url: 'https://api.mysite.com/webhooks/ratevoice', events: ['review.created', 'booking.new'], status: 'active', secret: 'whsec_...' },
];

export const apiKeysApi = {
  getKeys: async () => {
    await delay(800);
    return [...mockApiKeys];
  },

  createKey: async (data: Partial<ApiKey>) => {
    await delay(1000);
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: data.name || 'New Key',
      key: `pk_${data.environment === 'production' ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 16)}`,
      environment: data.environment || 'sandbox',
      status: 'active',
      createdAt: new Date().toISOString(),
      scopes: data.scopes || [],
      rateLimit: data.rateLimit || { requests: 100, period: 'minute' },
      ipWhitelist: data.ipWhitelist
    };
    mockApiKeys.push(newKey);
    return newKey;
  },

  revokeKey: async (id: string) => {
    await delay(500);
    const key = mockApiKeys.find(k => k.id === id);
    if (key) key.status = 'revoked';
    return { success: true };
  },

  getLogs: async () => {
    await delay(600);
    return [...mockLogs];
  },

  getWebhooks: async () => {
    await delay(600);
    return [...mockWebhooks];
  },
  
  addWebhook: async (url: string, events: string[]) => {
    await delay(800);
    const newHook: Webhook = {
      id: `wh_${Date.now()}`,
      url,
      events,
      status: 'active',
      secret: `whsec_${Math.random().toString(36).substr(2, 16)}`
    };
    mockWebhooks.push(newHook);
    return newHook;
  }
};

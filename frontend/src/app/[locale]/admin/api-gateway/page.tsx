'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminGatewayApi, ExternalApi } from '@/lib/api/admin/gateway';
import { RefreshCw, Key, Shield, Activity, Plus, Loader2, Copy, XCircle, CheckCircle2, Lock, Eye, Edit2, Play, AlertTriangle, Cpu, TrendingUp, Zap, Server } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for charts (until real metrics endpoint is fully populated)
const chartData = [
  { name: '00:00', requests: 400, errors: 2 },
  { name: '04:00', requests: 300, errors: 1 },
  { name: '08:00', requests: 1200, errors: 5 },
  { name: '12:00', requests: 2400, errors: 12 },
  { name: '16:00', requests: 3100, errors: 8 },
  { name: '20:00', requests: 1800, errors: 4 },
  { name: '23:59', requests: 800, errors: 2 },
];

export default function ApiGatewayPage() {
  const [apis, setApis] = useState<ExternalApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // New API Form State
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    key: '',
    endpoint: '',
    environment: 'production',
    category: 'AI',
    fallbackProviderId: '',
    cost: '',
    scopes: ['read:all']
  });

  const fetchApis = async () => {
    setIsLoading(true);
    try {
      const data = await adminGatewayApi.getApis();
      setApis(data);
      
      // Fetch optimization
      try {
        const recs = await adminGatewayApi.getOptimization();
        setRecommendations(recs);
      } catch (e) {
        console.error('Optimization fetch failed');
      }
    } catch (error) {
      toast.error("Failed to load External APIs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleAddApi = async () => {
    if (!formData.provider || !formData.key) return;
    setIsCreating(true);
    try {
      await adminGatewayApi.addApi(formData);
      toast.success("External API added successfully");
      setCreateOpen(false);
      setFormData({ 
        name: '', provider: '', key: '', endpoint: '', environment: 'production', 
        category: 'AI', fallbackProviderId: '', cost: '', scopes: ['read:all'] 
      });
      fetchApis();
    } catch (error) {
      toast.error("Failed to add API");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    toast.promise(adminGatewayApi.testConnection(id), {
      loading: 'Testing connection...',
      success: (data) => {
        fetchApis(); // Refresh status
        return `Connection successful (${data.latency}ms)`;
      },
      error: 'Connection failed'
    });
  };

  const handleStatusChange = async (id: string, status: 'active' | 'disabled') => {
    try {
      await adminGatewayApi.updateApiStatus(id, status);
      setApis(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success(`API ${status === 'active' ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = apis.filter(k => k.status === 'active').length;
  const failingCount = apis.filter(k => k.health === 'failing').length;
  const avgLatency = Math.round(apis.reduce((acc, curr) => acc + (curr.responseTime || 0), 0) / (apis.length || 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">AI API Integration Manager</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Control center for external integrations, failovers, and AI optimization.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchApis} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh Monitor
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                  <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="h-3.5 w-3.5 mr-2" /> Register API
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                  <DialogHeader>
                      <DialogTitle>Register External API</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={(v: string) => setFormData({...formData, category: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AI">AI & LLM</SelectItem>
                                    <SelectItem value="MAPS">Maps & Geocoding</SelectItem>
                                    <SelectItem value="SMS">SMS & Notifications</SelectItem>
                                    <SelectItem value="EMAIL">Email Services</SelectItem>
                                    <SelectItem value="PAYMENTS">Payments</SelectItem>
                                    <SelectItem value="STORAGE">Media Storage</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Provider Name</Label>
                            <Input 
                                value={formData.provider}
                                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                placeholder="e.g. OpenAI, Mapbox"
                            />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                          <Label>Endpoint URL (Optional for SDKs)</Label>
                          <Input 
                              value={formData.endpoint}
                              onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                              placeholder="https://api.example.com/v1"
                          />
                      </div>

                      <div className="space-y-2">
                          <Label>API Key (Encrypted)</Label>
                          <div className="relative">
                            <Input 
                                type="password"
                                value={formData.key}
                                onChange={(e) => setFormData({...formData, key: e.target.value})}
                                placeholder="sk_..."
                                className="pr-10"
                            />
                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fallback Provider</Label>
                            <Select 
                                value={formData.fallbackProviderId} 
                                onValueChange={(v: string) => setFormData({...formData, fallbackProviderId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {apis.filter(a => a.serviceName === formData.category).map(api => (
                                        <SelectItem key={api.id} value={api.id}>{api.providerName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Cost per 1k Units ($)</Label>
                            <Input 
                                type="number"
                                value={formData.cost}
                                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                                placeholder="0.002"
                            />
                        </div>
                      </div>

                      <Button onClick={handleAddApi} disabled={isCreating} className="w-full">
                          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Integration'}
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Recommendations Banner */}
      {recommendations.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                  <h3 className="font-bold text-sm text-blue-500 uppercase tracking-wide">AI Optimization Insights</h3>
                  <div className="space-y-1 mt-1">
                      {recommendations.map((rec, i) => (
                          <p key={i} className="text-sm text-muted-foreground">{rec.message}</p>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-4">
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active APIs</p>
                    <p className="text-2xl font-black text-emerald-500">{activeCount}</p>
                </div>
                <Activity className="h-8 w-8 text-emerald-500/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Health</p>
                    <p className={`text-2xl font-black ${failingCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {failingCount > 0 ? 'Degraded' : 'Healthy'}
                    </p>
                </div>
                <Server className={`h-8 w-8 ${failingCount > 0 ? 'text-red-500/20' : 'text-emerald-500/20'}`} />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Latency</p>
                    <p className="text-2xl font-black text-muted-foreground">{avgLatency}ms</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Cost (24h)</p>
                    <p className="text-2xl font-black text-muted-foreground">$12.45</p>
                </div>
                <Cpu className="h-8 w-8 text-muted-foreground/20" />
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Registry Table */}
          <div className="lg:col-span-2 space-y-6">
             <Card className="border-border/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" /> API Registry
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable 
                       title=""
                       columns={[
                           { key: 'name', header: 'Service', cell: (row: ExternalApi) => (
                               <div className="flex flex-col">
                                   <span className="font-bold text-sm">{row.name}</span>
                                   <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-mono text-muted-foreground">{row.providerName}</span>
                                   </div>
                               </div>
                           )},
                           { key: 'health', header: 'Status', cell: (row: ExternalApi) => (
                               <div className="flex items-center gap-2">
                                 <div className={`h-2 w-2 rounded-full ${
                                   row.health === 'healthy' ? 'bg-emerald-500' : 
                                   row.health === 'failing' ? 'bg-red-500' : 'bg-orange-500'
                                 }`} />
                                 <div className="flex flex-col">
                                    <span className="text-xs font-medium capitalize">{row.health}</span>
                                    {row.failureCount > 0 && <span className="text-[9px] text-red-500">{row.failureCount} fails</span>}
                                 </div>
                               </div>
                           )},
                           { key: 'responseTime', header: 'Performance', cell: (row: ExternalApi) => (
                               <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                 <div className="flex flex-col">
                                   <span className="font-bold">{row.responseTime}ms</span>
                                   <span className="text-[9px] uppercase">Latency</span>
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="font-bold">${row.costPerUnit || 0}</span>
                                   <span className="text-[9px] uppercase">Cost/1k</span>
                                 </div>
                               </div>
                           )},
                           { key: 'fallbackProvider', header: 'Failover', cell: (row: ExternalApi) => (
                               row.fallbackProvider ? (
                                   <Badge variant="outline" className="text-[9px] border-orange-500/20 text-orange-500">
                                       → {row.fallbackProvider.providerName}
                                   </Badge>
                               ) : (
                                   <span className="text-[10px] text-muted-foreground opacity-50">None</span>
                               )
                           )},
                           { key: 'actions', header: '', className: 'w-[100px] text-right', cell: (row: ExternalApi) => (
                               <div className="flex items-center justify-end gap-1">
                                   <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-8 w-8"
                                       onClick={() => handleTestConnection(row.id)}
                                       title="Test Connection"
                                   >
                                       <Play className="h-3.5 w-3.5" />
                                   </Button>
                                   {row.status === 'active' ? (
                                     <Button 
                                         variant="ghost" 
                                         size="icon"
                                         onClick={() => handleStatusChange(row.id, 'disabled')}
                                         className="h-8 w-8 text-rose-500 hover:text-rose-600"
                                     >
                                         <XCircle className="h-3.5 w-3.5" />
                                     </Button>
                                   ) : (
                                     <Button 
                                         variant="ghost" 
                                         size="icon"
                                         onClick={() => handleStatusChange(row.id, 'active')}
                                         className="h-8 w-8 text-emerald-500 hover:text-emerald-600"
                                     >
                                         <CheckCircle2 className="h-3.5 w-3.5" />
                                     </Button>
                                   )}
                               </div>
                           )},
                       ]}
                       data={apis}
                    />
                 </CardContent>
             </Card>
          </div>

          {/* Analytics Column */}
          <div className="space-y-6">
              <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                      <CardTitle className="text-lg">Usage Analytics</CardTitle>
                      <CardDescription>Requests per hour</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis fontSize={10} tickLine={false} axisLine={false} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                              <Tooltip 
                                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }}
                                  itemStyle={{ color: '#a1a1aa' }}
                              />
                              <Area type="monotone" dataKey="requests" stroke="#10b981" fillOpacity={1} fill="url(#colorRequests)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                      <CardTitle className="text-lg">Latency Trend</CardTitle>
                      <CardDescription>Response time (ms)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                             { name: '00:00', ms: 120 }, { name: '04:00', ms: 110 }, { name: '08:00', ms: 240 },
                             { name: '12:00', ms: 180 }, { name: '16:00', ms: 150 }, { name: '20:00', ms: 130 }
                          ]}>
                              <defs>
                                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis fontSize={10} tickLine={false} axisLine={false} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                              <Area type="monotone" dataKey="ms" stroke="#6366f1" fillOpacity={1} fill="url(#colorLatency)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}

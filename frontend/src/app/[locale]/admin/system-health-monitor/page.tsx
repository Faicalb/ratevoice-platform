'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    adminHealthApi, 
    ServerStatus, 
    ApiMetric, 
    SystemError, 
    SecurityThreats, 
    UserActivity, 
    DatabaseHealth, 
    AIDevOpsInsight 
} from '@/lib/api/admin/health';
import { 
    RefreshCw, Server, Activity, Database, Cloud, CheckCircle2, AlertTriangle, XCircle, 
    ShieldAlert, Users, BrainCircuit, Search, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar
} from 'recharts';

export default function SystemHealthMonitorPage() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [metrics, setMetrics] = useState<ApiMetric[]>([]);
  
  // New State
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [security, setSecurity] = useState<SecurityThreats | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);
  const [aiInsights, setAiInsights] = useState<AIDevOpsInsight | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Parallel fetch
      const [statusData, errorData, securityData, activityData, dbData, aiData] = await Promise.all([
        adminHealthApi.getStatus(),
        adminHealthApi.getErrors(),
        adminHealthApi.getSecurity(),
        adminHealthApi.getActivity(),
        adminHealthApi.getDatabase(),
        adminHealthApi.getAIInsights()
      ]);

      setServers(statusData.servers);
      setMetrics(statusData.metrics);
      setErrors(errorData);
      setSecurity(securityData);
      setActivity(activityData);
      setDbHealth(dbData);
      setAiInsights(aiData);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push('/admin/login');
      } else {
        toast.error("Failed to load system health data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && servers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'degraded': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'outage': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'outage': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">AI DevOps Monitor</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Real-time infrastructure status, security, and AI insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* 1. SYSTEM STATUS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         {servers.map((server) => (
            <Card key={server.id} className="border-border/50 shadow-sm hover:border-primary/30 transition-all">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                     {server.name}
                  </CardTitle>
                  {server.name.includes('Database') ? <Database className="h-4 w-4 text-muted-foreground" /> :
                   server.name.includes('Storage') ? <Cloud className="h-4 w-4 text-muted-foreground" /> :
                   <Server className="h-4 w-4 text-muted-foreground" />}
               </CardHeader>
               <CardContent>
                  <div className="flex items-center justify-between mb-4">
                     <Badge variant="outline" className={`uppercase text-[9px] tracking-widest flex items-center gap-1 ${getStatusColor(server.status)}`}>
                        {getStatusIcon(server.status)}
                        {server.status}
                     </Badge>
                     <span className="text-xs font-mono text-muted-foreground">{server.region}</span>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                           <span>Load</span>
                           <span>{server.load}%</span>
                        </div>
                        <Progress value={server.load} className={`h-1.5 ${server.load > 80 ? 'bg-rose-100' : ''}`} />
                     </div>
                     <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Latency</span>
                        <span className="font-mono font-bold">{server.latency}ms</span>
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>

      {/* 2. AI DEVOPS INSIGHTS */}
      {aiInsights && (
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center gap-4">
                <BrainCircuit className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-lg font-bold uppercase tracking-widest">AI DevOps Insights</CardTitle>
                    <CardDescription>Automated system analysis and repair suggestions</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {aiInsights.insights.map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${
                            insight.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/30' :
                            insight.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                            'bg-card border-border'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant={insight.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                    {insight.severity}
                                </Badge>
                            </div>
                            <h4 className="font-bold text-sm mb-1">{insight.issue}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{insight.cause}</p>
                            <div className="text-xs font-mono bg-background/50 p-2 rounded text-primary">
                                {insight.suggestion}
                            </div>
                        </div>
                    ))}
                    {aiInsights.insights.length === 0 && (
                        <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" /> System is running optimally. No issues detected.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      )}

      {/* 3. API PERFORMANCE & ERRORS */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">API Latency</CardTitle>
              <CardDescription className="text-xs">Response time over last 30 minutes</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={metrics}>
                    <defs>
                       <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="latency" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                 </AreaChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Recent Errors</CardTitle>
              <CardDescription className="text-xs">System exceptions and API failures</CardDescription>
           </CardHeader>
           <CardContent>
               <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                   {errors.map((err, idx) => (
                       <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 text-sm">
                           <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                           <div className="flex-1 space-y-1">
                               <div className="flex justify-between">
                                   <span className="font-bold">{err.endpoint}</span>
                                   <span className="text-xs text-muted-foreground">{new Date(err.timestamp).toLocaleTimeString()}</span>
                               </div>
                               <p className="text-xs text-muted-foreground">{err.error}</p>
                               <Badge variant="outline" className="text-[10px] h-5">{err.statusCode}</Badge>
                           </div>
                       </div>
                   ))}
                   {errors.length === 0 && <div className="text-center text-muted-foreground py-10">No recent errors</div>}
               </div>
           </CardContent>
        </Card>
      </div>

      {/* 4. SECURITY & DATABASE */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Security Card */}
          <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Security Monitor</CardTitle>
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-xs font-medium">Failed Logins</span>
                          <span className="text-xl font-bold font-mono text-rose-500">{security?.failedLoginAttempts || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-xs font-medium">Blocked Requests</span>
                          <span className="text-xl font-bold font-mono text-amber-500">{security?.blockedRequests || 0}</span>
                      </div>
                      <div>
                          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Suspicious IPs</h4>
                          <div className="space-y-2">
                              {security?.suspiciousIPs.map((ip, i) => (
                                  <div key={i} className="flex justify-between text-xs font-mono border-b border-border/50 pb-1">
                                      <span>{ip.ip}</span>
                                      <span className="text-rose-500">{ip.attempts} attempts</span>
                                  </div>
                              ))}
                              {(!security?.suspiciousIPs || security.suspiciousIPs.length === 0) && (
                                  <div className="text-xs text-muted-foreground">No suspicious activity detected.</div>
                              )}
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          {/* Database Health */}
          <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Database Health</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                          <span className="text-[10px] uppercase text-muted-foreground">Status</span>
                          <div className="flex items-center gap-1 font-bold text-sm">
                              <div className={`h-2 w-2 rounded-full ${dbHealth?.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {dbHealth?.connectionStatus || 'Unknown'}
                          </div>
                      </div>
                      <div className="space-y-1">
                          <span className="text-[10px] uppercase text-muted-foreground">Size</span>
                          <div className="font-bold text-sm font-mono">{dbHealth?.databaseSize}</div>
                      </div>
                      <div className="space-y-1">
                          <span className="text-[10px] uppercase text-muted-foreground">Slow Queries</span>
                          <div className="font-bold text-sm font-mono text-amber-500">{dbHealth?.slowQueries || 0}</div>
                      </div>
                      <div className="space-y-1">
                          <span className="text-[10px] uppercase text-muted-foreground">Tables</span>
                          <div className="font-bold text-sm font-mono">{dbHealth?.totalTables}</div>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground">Record Counts</h4>
                      <div className="grid grid-cols-2 gap-2">
                         {Object.entries(dbHealth?.recordCounts || {}).map(([key, val]) => (
                             <div key={key} className="flex justify-between text-xs bg-muted/30 p-1 px-2 rounded">
                                 <span className="capitalize">{key}</span>
                                 <span className="font-mono">{val}</span>
                             </div>
                         ))}
                      </div>
                  </div>
              </CardContent>
          </Card>

          {/* User Activity */}
          <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">User Activity</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active Now</span>
                          <span className="text-2xl font-black text-emerald-500">{activity?.activeUsersNow || 0}</span>
                      </div>
                      <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                              <span>New Users Today</span>
                              <span className="font-bold">{activity?.newUsersToday || 0}</span>
                          </div>
                          <Progress value={(activity?.newUsersToday || 0) * 5} className="h-1" />
                      </div>
                      <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                              <span>Reviews Posted</span>
                              <span className="font-bold">{activity?.reviewsPostedToday || 0}</span>
                          </div>
                          <Progress value={(activity?.reviewsPostedToday || 0) * 2} className="h-1" />
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
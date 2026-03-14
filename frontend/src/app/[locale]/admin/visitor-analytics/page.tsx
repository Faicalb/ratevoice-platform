'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminAnalyticsApi, VisitorStat, TrafficData } from '@/lib/api/admin/analytics';
import { RefreshCw, TrendingUp, Users, Globe, Eye } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function VisitorAnalyticsPage() {
  const [stats, setStats] = useState<VisitorStat[]>([]);
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await adminAnalyticsApi.getVisitorStats();
      setStats(data.stats);
      setTraffic(data.traffic);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalVisitors = stats.reduce((acc, curr) => acc + curr.visitors, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Visitor Analytics</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Global traffic and engagement insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Visitors</p>
                    <p className="text-2xl font-black">{totalVisitors.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Growth</p>
                    <p className="text-2xl font-black text-emerald-500">+8.5%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Regions</p>
                    <p className="text-2xl font-black">{stats.length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500/20" />
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Traffic Trend</CardTitle>
              <CardDescription className="text-xs">Weekly visitor volume</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={traffic}>
                    <defs>
                       <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                       dataKey="date" 
                       stroke="var(--muted-foreground)" 
                       fontSize={10} 
                       tickLine={false} 
                       axisLine={false}
                    />
                    <YAxis 
                       stroke="var(--muted-foreground)" 
                       fontSize={10} 
                       tickLine={false} 
                       axisLine={false}
                    />
                    <Tooltip 
                       contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          borderColor: 'var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px'
                       }}
                    />
                    <Area 
                       type="monotone" 
                       dataKey="visitors" 
                       stroke="var(--primary)" 
                       strokeWidth={2}
                       fillOpacity={1} 
                       fill="url(#colorTraffic)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Page Views</CardTitle>
              <CardDescription className="text-xs">Engagement per day</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={traffic}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                       dataKey="date" 
                       stroke="var(--muted-foreground)" 
                       fontSize={10} 
                       tickLine={false} 
                       axisLine={false}
                    />
                    <YAxis 
                       stroke="var(--muted-foreground)" 
                       fontSize={10} 
                       tickLine={false} 
                       axisLine={false}
                    />
                    <Tooltip 
                       contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          borderColor: 'var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px'
                       }}
                       cursor={{ fill: 'var(--muted)' }}
                    />
                    <Bar dataKey="pageViews" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={30} opacity={0.8} />
                 </BarChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
         <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Regional Breakdown</CardTitle>
         </CardHeader>
         <CardContent>
            <DataTable 
               title=""
               columns={[
                   { key: 'country', header: 'Country', cell: (row: any) => (
                       <div className="flex items-center gap-2">
                           <span className="text-lg">{row.flag}</span>
                           <span className="font-medium">{row.country}</span>
                       </div>
                   )},
                   { key: 'visitors', header: 'Visitors', cell: (row: any) => row.visitors.toLocaleString() },
                   { key: 'growth', header: 'Growth', cell: (row: any) => (
                       <span className={`font-bold ${row.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {row.growth >= 0 ? '+' : ''}{row.growth}%
                       </span>
                   )},
                   { key: 'share', header: 'Share', cell: (row: any) => (
                       <div className="flex items-center gap-2 w-[100px]">
                           <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                               <div 
                                   className="h-full bg-primary" 
                                   style={{ width: `${(row.visitors / totalVisitors * 100)}%` }}
                               />
                           </div>
                           <span className="text-[10px] text-muted-foreground">
                               {Math.round(row.visitors / totalVisitors * 100)}%
                           </span>
                       </div>
                   )},
               ]}
               data={stats}
            />
         </CardContent>
      </Card>
    </div>
  );
}

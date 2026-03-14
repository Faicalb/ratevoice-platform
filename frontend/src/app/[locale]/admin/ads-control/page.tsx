'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminAdsApi, Ad } from '@/lib/api/admin/ads';
import { 
  RefreshCw, DollarSign, MoreHorizontal, CheckCircle2, XCircle, 
  Activity, BarChart3, Zap, Target
} from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateAdModal } from '@/components/admin/ads/create-ad-modal';

export default function AdsControlPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const [adsData, statsData] = await Promise.all([
        adminAdsApi.getAds(),
        adminAdsApi.getStats()
      ]);
      setAds(adsData);
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to load ads data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleStatusChange = async (id: string, action: 'pause' | 'resume' | 'delete') => {
    try {
      if (action === 'pause') await adminAdsApi.pauseAd(id);
      if (action === 'resume') await adminAdsApi.resumeAd(id);
      if (action === 'delete') await adminAdsApi.deleteAd(id);
      
      toast.success(`Ad ${action}d successfully`);
      fetchAds();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleOptimize = async (id: string) => {
    try {
      const result = await adminAdsApi.optimizeAd(id);
      toast.success("AI Optimization completed. Suggestions applied.");
      // In a real app, we'd show the suggestions in a modal
      console.log(result);
    } catch (error) {
      toast.error("Optimization failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mock chart data if not provided by stats
  const revenueData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 550 },
    { name: 'Thu', value: 450 },
    { name: 'Fri', value: 600 },
    { name: 'Sat', value: 800 },
    { name: 'Sun', value: 700 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">AI Ads Platform</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage campaigns, optimize placements, and track revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <CreateAdModal onSuccess={fetchAds} />
           <Button variant="outline" size="sm" onClick={fetchAds} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Ads" value={stats?.totalAds || 0} icon={Target} description="All time campaigns" />
            <StatsCard title="Active Campaigns" value={stats?.activeAds || 0} icon={Activity} description="Currently running" />
            <StatsCard title="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} description="Platform earnings" />
            <StatsCard title="Avg CTR" value={`${(stats?.averageCtr || 0).toFixed(2)}%`} icon={Zap} description="Click through rate" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50 shadow-lg">
               <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <BarChart3 className="h-4 w-4 text-primary" /> Revenue Trend
                  </CardTitle>
               </CardHeader>
               <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={revenueData}>
                        <defs>
                           <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                           itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
               <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <Target className="h-4 w-4 text-emerald-500" /> Top Placements
                  </CardTitle>
               </CardHeader>
               <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>Placement analytics visualization coming soon</p>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <Card className="border-border/50 shadow-lg">
             <CardContent className="p-0">
                <DataTable 
                   title=""
                   columns={[
                       { key: 'title', header: 'Campaign', cell: (row: any) => (
                           <div>
                               <p className="font-bold text-sm">{row.title}</p>
                               <p className="text-[10px] text-muted-foreground">{row.advertiserName}</p>
                           </div>
                       )},
                       { key: 'placement', header: 'Placement', cell: (row: any) => (
                           <Badge variant="outline" className="text-[9px] uppercase">{row.placement.replace('_', ' ')}</Badge>
                       )},
                       { key: 'impressions', header: 'Performance', cell: (row: any) => (
                           <div className="text-xs">
                               <div className="flex gap-2">
                                   <span className="font-bold">{row.impressions}</span> <span className="text-muted-foreground">Impr</span>
                               </div>
                               <div className="flex gap-2">
                                   <span className="font-bold">{row.clicks}</span> <span className="text-muted-foreground">Clicks</span>
                               </div>
                           </div>
                       )},
                       { key: 'ctr', header: 'CTR', cell: (row: any) => (
                           <div className={cn("font-bold font-mono", row.ctr > 2 ? "text-emerald-500" : "text-muted-foreground")}>
                               {row.ctr.toFixed(2)}%
                           </div>
                       )},
                       { key: 'revenue', header: 'Revenue', cell: (row: any) => (
                           <div className="font-bold text-emerald-500">${row.revenue.toFixed(2)}</div>
                       )},
                       { key: 'status', header: 'Status', cell: (row: any) => (
                           <Badge variant={
                               row.status === 'ACTIVE' ? 'default' : 
                               row.status === 'PAUSED' ? 'secondary' : 'destructive'
                           } className="uppercase text-[9px] tracking-widest">
                               {row.status}
                           </Badge>
                       )},
                       { key: 'actions', header: '', className: 'w-[50px]', cell: (row: any) => (
                           <DropdownMenu>
                               <DropdownMenuTrigger className="h-8 w-8 p-0">
                                   <MoreHorizontal className="h-4 w-4" />
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => handleOptimize(row.id)}>
                                       <Zap className="mr-2 h-4 w-4 text-amber-500" /> AI Optimize
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   {row.status !== 'ACTIVE' && (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'resume')}>
                                           <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Resume
                                       </DropdownMenuItem>
                                   )}
                                   {row.status === 'ACTIVE' && (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'pause')}>
                                           <XCircle className="mr-2 h-4 w-4 text-amber-500" /> Pause
                                       </DropdownMenuItem>
                                   )}
                                   <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'delete')}>
                                       <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Delete
                                   </DropdownMenuItem>
                               </DropdownMenuContent>
                           </DropdownMenu>
                       )},
                   ]}
                   data={ads}
                />
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Placement Control</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Configure ad slots, priorities, and rotation rules here.</p>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Local Ads Marketplace</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Approve and manage user-submitted ad listings.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

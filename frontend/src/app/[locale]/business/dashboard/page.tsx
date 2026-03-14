'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Star, 
  Smile, 
  Calendar, 
  Wallet, 
  Bell, 
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function BusinessDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['business-dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Handle errors via side effect or just show empty state
  if (error) {
    // In a real app, use an error boundary or toast here
    console.error("Failed to load dashboard data", error);
  }

  const { data: trends } = useQuery({
    queryKey: ['business-trends'],
    queryFn: dashboardApi.getTrends,
    refetchInterval: 60000,
  });

  // Map backend trends to chart format
  const reviewTrendData = trends?.map((t: any) => ({
    name: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    reviews: t.reviews
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Dashboard</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Real-time overview of your business performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href="/business/reports">
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Reviews" 
          value={stats?.totalReviews || 0} 
          trend={stats?.trends.reviews} 
          icon={MessageSquare} 
        />
        <StatsCard 
          title="Avg Rating" 
          value={stats?.averageRating.toFixed(1) || "0.0"} 
          description="Based on last 30 days"
          icon={Star} 
        />
        <StatsCard 
          title="Satisfaction" 
          value={`${stats?.satisfactionScore}%`} 
          trend={stats?.trends.satisfaction} 
          icon={Smile} 
        />
        <StatsCard 
          title="Active Bookings" 
          value={stats?.activeBookings || 0} 
          trend={stats?.trends.bookings} 
          icon={Calendar} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Review Trend</CardTitle>
            <CardDescription className="text-xs">Weekly voice review volume</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reviewTrendData}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    tick={{ fill: 'var(--muted-foreground)' }}
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                />
                <Area 
                    type="monotone" 
                    dataKey="reviews" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorReviews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center justify-between">
                <span>Recent Activity</span>
                <Bell className="h-4 w-4 text-muted-foreground" />
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                {stats?.notifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 relative pl-4 border-l-2 border-border/50">
                        <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                            notif.type === 'success' ? 'bg-emerald-500' :
                            notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{notif.message}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{notif.time}</p>
                        </div>
                    </div>
                ))}
                
                <Button variant="ghost" className="w-full text-xs uppercase font-bold tracking-widest text-muted-foreground hover:text-foreground">
                    View All Activity
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    Wallet Balance
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                    Active
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black tracking-tight mb-4">
                    ${stats?.walletBalance.toFixed(2)}
                </div>
                <div className="flex gap-3">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] h-8">
                        Add Funds
                    </Button>
                    <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px] h-8">
                        History
                    </Button>
                </div>
            </CardContent>
         </Card>
         
         <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Customer Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium">Positive (78%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium">Neutral (15%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-rose-500" />
                        <span className="text-xs font-medium">Negative (7%)</span>
                    </div>
                </div>
                <div className="h-24 w-24 rounded-full border-8 border-emerald-500/20 flex items-center justify-center relative">
                     <div className="absolute inset-0 rounded-full border-t-8 border-l-8 border-emerald-500 rotate-45" />
                     <span className="text-xl font-bold">92</span>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

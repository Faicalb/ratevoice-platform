'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsApi, AnalyticsData } from '@/lib/api/analytics';
import { RefreshCw, BarChart2, Clock, Users, ArrowUpRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await analyticsApi.getData();
      setData(result);
    } catch (error) {
      toast.error("Failed to load analytics data");
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

  const sentimentData = [
    { name: 'Positive', value: data?.sentiment.positive || 0, color: '#10b981' },
    { name: 'Neutral', value: data?.sentiment.neutral || 0, color: '#f59e0b' },
    { name: 'Negative', value: data?.sentiment.negative || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Analytics</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Deep dive into your business performance and customer insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Sentiment Analysis</CardTitle>
            <CardDescription className="text-xs">Customer emotion breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-4">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Peak Traffic Hours</CardTitle>
            <CardDescription className="text-xs">Visitor density throughout the day</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.peakHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                    dataKey="hour" 
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
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted/20 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Avg Response Time</p>
              <h3 className="text-2xl font-black">{data?.performance.avgResponseTime}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full">
              <ArrowUpRight className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Response Rate</p>
              <h3 className="text-2xl font-black">{data?.performance.responseRate}%</h3>
            </div>
          </CardContent>
        </Card>

         <Card className="bg-muted/20 border-border/50 md:col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Resolved Complaints</p>
                <h3 className="text-2xl font-black">{data?.performance.resolvedComplaints}</h3>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs text-emerald-500 font-bold flex items-center justify-end">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12%
                </p>
                <p className="text-[10px] text-muted-foreground">vs last month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable 
        title="Branch Performance"
        columns={[
            { key: 'name', header: 'Branch Name' },
            { key: 'rating', header: 'Rating', cell: (row: any) => (
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span>{row.rating}</span>
                </div>
            )},
            { key: 'reviews', header: 'Total Reviews' },
            { key: 'responseTime', header: 'Response Time' },
        ]}
        data={data?.branches || []}
      />
    </div>
  );
}

// Importing Star icon locally since it's used in the cell render
import { Star } from 'lucide-react';

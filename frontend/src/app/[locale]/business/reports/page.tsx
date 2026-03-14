'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { businessReportsApi, ReportFile } from '@/lib/api/business-reports';
import { reportsAnalyticsApi, ReportAnalytics } from '@/lib/api/business-reports-analytics';
import { RefreshCw, FileText, Download, Filter, Calendar, FileSpreadsheet, File as FileIcon, Loader2, Plus, MessageSquare, Star, Smile, Wallet, TrendingUp, Users, Activity, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { StatsCard } from '@/components/stats-card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [date, setDate] = useState<{ from: Date; to: Date } | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'custom'>('30days');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsData, analyticsData] = await Promise.all([
        businessReportsApi.getReports(),
        reportsAnalyticsApi.getAnalytics(timeRange)
      ]);
      setReports(reportsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error("Failed to load reports data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await businessReportsApi.generateReport('custom', date || { from: new Date(), to: new Date() });
      toast.success("Report generation started.");
      fetchData();
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredReports = filterCategory === 'all' 
    ? reports 
    : reports.filter(r => r.category === filterCategory);

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
          <h1 className="text-3xl font-black uppercase tracking-tight">Analytics & Reports</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Detailed business performance analytics and downloadable reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-muted/50 rounded-lg p-1 mr-2">
             <Button 
               variant={timeRange === 'today' ? 'secondary' : 'ghost'} 
               size="sm" 
               onClick={() => setTimeRange('today')}
               className="h-7 text-[10px] uppercase font-bold"
             >
               Today
             </Button>
             <Button 
               variant={timeRange === '7days' ? 'secondary' : 'ghost'} 
               size="sm" 
               onClick={() => setTimeRange('7days')}
               className="h-7 text-[10px] uppercase font-bold"
             >
               7 Days
             </Button>
             <Button 
               variant={timeRange === '30days' ? 'secondary' : 'ghost'} 
               size="sm" 
               onClick={() => setTimeRange('30days')}
               className="h-7 text-[10px] uppercase font-bold"
             >
               30 Days
             </Button>
           </div>
           
           <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs uppercase font-bold tracking-widest">
                  <Calendar className="h-3.5 w-3.5 mr-2" /> 
                  {date?.from ? (
                    date.to ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}` : format(date.from, "MMM dd")
                  ) : "Custom Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date as any}
                  onSelect={(range) => {
                    setDate(range as any);
                    if (range?.from && range?.to) setTimeRange('custom');
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground">
                      <Download className="h-3.5 w-3.5 mr-2" /> Export
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast.success("Exporting as PDF...")}>
                      <FileText className="mr-2 h-4 w-4" /> Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.success("Exporting as Excel...")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Reviews" 
          value={analytics?.overview.totalReviews || 0} 
          icon={MessageSquare}
          description="Total received reviews"
        />
        <StatsCard 
          title="Avg Rating" 
          value={analytics?.overview.avgRating.toFixed(1) || "0.0"} 
          icon={Star}
          description="Average customer rating"
        />
        <StatsCard 
          title="Satisfaction" 
          value={`${analytics?.overview.satisfaction}%`} 
          icon={Smile}
          description="Customer satisfaction score"
        />
        <StatsCard 
          title="Active Bookings" 
          value={analytics?.overview.activeBookings || 0} 
          icon={Calendar}
          description="Confirmed upcoming bookings"
        />
        <StatsCard 
          title="Total Revenue" 
          value={`$${analytics?.overview.revenue.toLocaleString()}`} 
          icon={TrendingUp}
          description="Gross revenue generated"
        />
        <StatsCard 
          title="Wallet Balance" 
          value={`$${analytics?.overview.walletBalance.toLocaleString()}`} 
          icon={Wallet}
          description="Available for payout"
        />
        <StatsCard 
          title="Ad Impressions" 
          value={analytics?.overview.adImpressions.toLocaleString()} 
          icon={Target}
          description="Total ad views"
        />
        <StatsCard 
          title="Unique Visitors" 
          value={analytics?.overview.visitors.toLocaleString()} 
          icon={Users}
          description="Page visitors count"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Review Trend Chart */}
        <Card className="md:col-span-2 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Review Trend Analysis</CardTitle>
            <CardDescription className="text-xs">Volume of reviews over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.charts.reviewTrend}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" fillOpacity={1} fill="url(#colorReviews)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-indigo-500">
                <Activity className="h-4 w-4" />
                AI Smart Insights
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {analytics?.aiInsights.map((insight, i) => (
                 <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">{insight}</p>
                 </div>
               ))}
               <Button variant="outline" className="w-full text-xs uppercase font-bold text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/10">
                 View Full Analysis
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Bookings Bar Chart */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Booking Statistics</CardTitle>
            <CardDescription className="text-xs">Daily bookings volume</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.charts.bookingsPerDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Pie Chart */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Customer Sentiment</CardTitle>
            <CardDescription className="text-xs">Review sentiment distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.charts.sentiment}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics?.charts.sentiment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-bold">{analytics?.overview.satisfaction}%</span>
                <p className="text-[10px] text-muted-foreground uppercase">Positive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visitor Locations (Map Replacement) */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Visitor Locations</CardTitle>
            <CardDescription className="text-xs">Top regions by traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.charts.visitorLocations.map((loc) => (
                <div key={loc.code} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{loc.code}</span>
                      <span>{loc.country}</span>
                    </div>
                    <span>{loc.visitors.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(loc.visitors / (analytics.charts.visitorLocations[0]?.visitors || 1)) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Archive Section */}
      <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Reports Archive
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                    variant={filterCategory === 'all' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setFilterCategory('all')}
                    className="text-[10px] uppercase font-bold"
                >
                    All
                </Button>
                <Button 
                    variant={filterCategory === 'financial' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setFilterCategory('financial')}
                    className="text-[10px] uppercase font-bold"
                >
                    Financial
                </Button>
                <Button 
                    variant={filterCategory === 'reviews' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setFilterCategory('reviews')}
                    className="text-[10px] uppercase font-bold"
                >
                    Reviews
                </Button>
              </div>
          </CardHeader>
          <CardContent>
              <DataTable 
                title=""
                columns={[
                    { key: 'name', header: 'Report Name', cell: (row: any) => (
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                                row.type === 'pdf' ? 'bg-rose-500/10 text-rose-500' :
                                row.type === 'excel' ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-blue-500/10 text-blue-500'
                            }`}>
                                {row.type === 'pdf' ? <FileText className="h-4 w-4" /> :
                                  row.type === 'excel' ? <FileSpreadsheet className="h-4 w-4" /> :
                                  <FileIcon className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{row.name}</p>
                                <p className="text-[10px] text-muted-foreground">{row.dateRange}</p>
                            </div>
                        </div>
                    )},
                    { key: 'category', header: 'Category', cell: (row: any) => (
                        <Badge variant="outline" className="uppercase text-[9px] tracking-widest">
                            {row.category}
                        </Badge>
                    )},
                    { key: 'generatedAt', header: 'Generated', cell: (row: any) => new Date(row.generatedAt).toLocaleDateString() },
                    { key: 'size', header: 'Size', className: 'font-mono text-xs text-muted-foreground' },
                    { key: 'actions', header: '', className: 'w-[100px] text-right', cell: (row: any) => (
                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                            <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                    )},
                ]}
                data={filteredReports}
              />
          </CardContent>
      </Card>
    </div>
  );
}

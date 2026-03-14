'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reputationApi, ReputationData } from '@/lib/api/reputation';
import { RefreshCw, Star, TrendingUp, Users, Clock, Award } from 'lucide-react';
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
import { toast } from 'sonner';

export default function ReputationScorePage() {
  const [data, setData] = useState<ReputationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await reputationApi.getReputation();
      setData(result);
    } catch (error) {
      toast.error("Failed to load reputation data");
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

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-emerald-500';
    if (score >= 7.0) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'Excellent': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Good': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Average': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
  };

  const breakdownData = data ? [
    { name: 'Service', score: data.breakdown.service },
    { name: 'Cleanliness', score: data.breakdown.cleanliness },
    { name: 'Value', score: data.breakdown.value },
    { name: 'Location', score: data.breakdown.location },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Reputation Score</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Monitor and improve your global business reputation.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-2 border-border/50 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Global Score</h2>
              <div className={`text-6xl font-black tracking-tighter ${getScoreColor(data?.score || 0)}`}>
                {data?.score}
                <span className="text-2xl text-muted-foreground font-normal">/10</span>
              </div>
              <Badge variant="outline" className={`mt-2 ${getGradeColor(data?.grade || 'Average')}`}>
                {data?.grade}
              </Badge>
            </div>
            <div className="h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center relative">
               <Award className={`h-16 w-16 ${getScoreColor(data?.score || 0)}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <Users className="h-4 w-4 text-blue-500" />
                 Interaction Rate
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-3xl font-black tracking-tight mb-1">{data?.interactionRate}%</div>
              <p className="text-xs text-muted-foreground">
                 {data?.totalInteractions} total interactions
              </p>
              <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: `${data?.interactionRate}%` }} />
              </div>
           </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <Clock className="h-4 w-4 text-purple-500" />
                 Response Speed
              </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="text-3xl font-black tracking-tight mb-1">{data?.responseSpeed}</div>
              <p className="text-xs text-muted-foreground">
                 Average time to reply
              </p>
               <div className="flex gap-1 mt-4">
                 <div className={`h-1.5 flex-1 rounded-full ${data?.responseSpeed === 'Fast' ? 'bg-emerald-500' : 'bg-muted'}`} />
                 <div className={`h-1.5 flex-1 rounded-full ${data?.responseSpeed === 'Average' ? 'bg-amber-500' : data?.responseSpeed === 'Fast' ? 'bg-emerald-500' : 'bg-muted'}`} />
                 <div className={`h-1.5 flex-1 rounded-full ${data?.responseSpeed === 'Slow' ? 'bg-rose-500' : data?.responseSpeed !== 'Slow' ? 'bg-emerald-500' : 'bg-muted'}`} />
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Score History</CardTitle>
            <CardDescription className="text-xs">Reputation trend over last 4 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.history}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
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
                    domain={[0, 10]}
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
                    dataKey="score" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Category Breakdown</CardTitle>
            <CardDescription className="text-xs">Performance by key metrics</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={breakdownData} margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                <XAxis type="number" domain={[0, 10]} hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    width={80}
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
                <Bar dataKey="score" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20}>
                    {/* Optional: Label list can be added here */}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { marketApi, MarketInsight } from '@/lib/api/market';
import { RefreshCw, Search, Zap, TrendingUp, Lightbulb, Loader2, Target, MapPin, CheckCircle2, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function AiMarketSearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [insight, setInsight] = useState<MarketInsight | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const data = await marketApi.searchMarket(query);
      setInsight(data);
    } catch (error) {
      toast.error("Failed to fetch market insights");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">AI Market Search</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Use AI to explore market trends and opportunities.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-lg bg-gradient-to-r from-primary/5 via-background to-background">
         <CardContent className="p-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                     placeholder="Ask anything... e.g. 'Demand for luxury spas in Paris'" 
                     className="pl-10 h-12 text-lg shadow-sm"
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                  />
               </div>
               <Button type="submit" disabled={isSearching} className="h-12 px-8 uppercase font-bold tracking-widest shadow-md w-full sm:w-auto">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  {isSearching ? 'Analyzing...' : 'Generate Insights'}
               </Button>
            </form>
         </CardContent>
      </Card>

      {insight && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
               <Card className="border-border/50 shadow-md">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Demand Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className={`text-2xl font-black ${insight.demandLevel === 'High' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {insight.demandLevel}
                     </div>
                  </CardContent>
               </Card>
               <Card className="border-border/50 shadow-md">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Competition</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className={`text-2xl font-black ${insight.competitionLevel === 'High' ? 'text-red-500' : 'text-blue-500'}`}>
                        {insight.competitionLevel}
                     </div>
                  </CardContent>
               </Card>
               <Card className="border-border/50 shadow-md">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-2xl font-black flex items-center gap-2 text-primary">
                        <TrendingUp className="h-6 w-6" />
                        {insight.trend === 'up' ? 'Rising' : 'Stable'}
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               {/* Main Summary */}
               <Card className="border-border/50 shadow-lg md:col-span-2">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        AI Summary Report
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-lg font-medium leading-relaxed">
                        {insight.summary}
                     </p>
                     <div className="mt-6 flex flex-wrap gap-3">
                        {insight.recommendations.map((rec, i) => (
                           <div key={i} className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {rec}
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>

               {/* Growth Trend Chart */}
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Demand Growth
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={insight.dataPoints}>
                           <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                           <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                           <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                           <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>

               {/* Demand Heatmap */}
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-500" />
                        Demand Heatmap
                     </CardTitle>
                     <CardDescription className="text-xs">High activity zones & tourist hotspots</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                           <XAxis type="number" dataKey="x" name="Longitude" hide />
                           <YAxis type="number" dataKey="y" name="Latitude" hide />
                           <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Intensity" />
                           <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                              if (payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border p-2 rounded shadow-sm text-xs">
                                    <p className="font-bold">{data.name}</p>
                                    <p>Intensity: {data.z}</p>
                                  </div>
                                );
                              }
                              return null;
                           }} />
                           <Scatter name="Zones" data={insight.heatmapData} fill="#f43f5e" fillOpacity={0.6} />
                        </ScatterChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>

               {/* Competition Analysis */}
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-blue-500" />
                        Competition Saturation
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={insight.competitionBreakdown} layout="vertical" margin={{ left: 40 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" opacity={0.5} />
                           <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                           <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={80} />
                           <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                           <Bar dataKey="saturation" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} name="Saturation %" />
                        </BarChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>

               {/* Opportunities */}
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        Opportunities Detected
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {insight.opportunities.map((opp, i) => (
                        <div key={i} className="p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-sm">{opp.title}</h4>
                              <Badge variant={opp.type === 'gap' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                 {opp.type}
                              </Badge>
                           </div>
                           <p className="text-xs text-muted-foreground leading-relaxed">
                              {opp.description}
                           </p>
                        </div>
                     ))}
                  </CardContent>
               </Card>
            </div>
         </div>
      )}
    </div>
  );
}

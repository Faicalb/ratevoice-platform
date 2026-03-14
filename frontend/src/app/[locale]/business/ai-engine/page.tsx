'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { aiEngineApi, AiInsight, Prediction } from '@/lib/api/ai-engine';
import { RefreshCw, BrainCircuit, TrendingUp, Zap, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function AiEnginePage() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [insightsData, predictionsData] = await Promise.all([
        aiEngineApi.getInsights(),
        aiEngineApi.getPredictions()
      ]);
      setInsights(insightsData);
      setPredictions(predictionsData);
    } catch (error) {
      toast.error("Failed to load AI data");
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">AI Engine</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Predictive analytics and intelligent business recommendations.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/50 shadow-lg bg-gradient-to-br from-card to-primary/5">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="h-4 w-4 text-primary" />
                 Booking Demand Prediction
              </CardTitle>
              <CardDescription className="text-xs">Forecast for the upcoming week based on historical data.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={predictions}>
                    <defs>
                       <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                       dataKey="value" 
                       stroke="var(--primary)" 
                       strokeWidth={2}
                       fillOpacity={1} 
                       fill="url(#colorValue)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        <div className="space-y-6">
           {insights.map((insight) => (
              <Card key={insight.id} className="border-border/50 shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                 <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                       <Badge variant={
                           insight.impact === 'high' ? 'destructive' :
                           insight.impact === 'medium' ? 'default' : 'secondary'
                       } className="uppercase text-[9px] tracking-widest">
                           {insight.impact} Impact
                       </Badge>
                       <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                           <BrainCircuit className="h-3 w-3" />
                           {insight.confidence}% confidence
                       </div>
                    </div>
                    
                    <div className="space-y-1">
                        <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                            {insight.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.description}
                        </p>
                    </div>

                    {insight.action && (
                        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                                <Zap className="h-3 w-3" /> Recommended Action
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                    )}
                 </CardContent>
              </Card>
           ))}
        </div>
      </div>
    </div>
  );
}

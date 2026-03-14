'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiApi, AIAnalysisData } from '@/lib/api/ai';
import { RefreshCw, BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { toast } from 'sonner';

export default function AiCommentAnalysisPage() {
  const [data, setData] = useState<AIAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await aiApi.getAnalysis();
      setData(result);
    } catch (error) {
      toast.error("Failed to load AI analysis");
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

  const emotionData = [
    { subject: 'Joy', A: data?.emotions.joy, fullMark: 100 },
    { subject: 'Anger', A: data?.emotions.anger, fullMark: 100 },
    { subject: 'Sadness', A: data?.emotions.sadness, fullMark: 100 },
    { subject: 'Surprise', A: data?.emotions.surprise, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">AI Analysis</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            AI-powered insights from customer feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Emotion Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Emotion"
                  dataKey="A"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.4}
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Keyword Extraction</CardTitle>
            <CardDescription className="text-xs">Most frequent terms in customer reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
                {data?.keywords.map((keyword, i) => (
                    <div 
                        key={i} 
                        className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${
                            keyword.sentiment === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            keyword.sentiment === 'negative' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}
                    >
                        {keyword.text}
                        <span className="bg-background/50 px-1.5 py-0.5 rounded-full text-[9px] opacity-70">
                            {keyword.count}
                        </span>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-border/50 shadow-lg">
            <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Complaint Alerts
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data?.complaints.map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${
                                complaint.severity === 'high' ? 'bg-rose-500' :
                                complaint.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-sm font-medium">{complaint.text}</span>
                        </div>
                        <Badge variant={complaint.status === 'resolved' ? 'secondary' : 'destructive'} className="text-[10px] uppercase font-bold tracking-widest">
                            {complaint.status}
                        </Badge>
                    </div>
                ))}
            </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    Overall Emotion Score
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-6xl font-black text-primary tracking-tighter">
                    {data?.emotionScore}
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                    Positive Sentiment
                </p>
                <div className="w-full bg-muted h-2 rounded-full mt-6 overflow-hidden max-w-xs">
                    <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out" 
                        style={{ width: `${data?.emotionScore}%` }} 
                    />
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportsApi, SmartReport } from '@/lib/api/smart-reports';
import { RefreshCw, FileText, BrainCircuit, Download, ArrowUpRight, ArrowDownRight, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function SmartReportsPage() {
  const [report, setReport] = useState<SmartReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const data = await reportsApi.getSmartSummary();
      setReport(data);
      toast.success("New AI report generated!");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Smart Reports</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            AI-generated summaries of your business performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={generateReport} disabled={isGenerating} className="h-9 text-xs uppercase font-bold tracking-widest">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
            Regenerate
          </Button>
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
            <Card className="border-border/50 shadow-lg bg-gradient-to-br from-primary/5 via-card to-card">
               <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <BrainCircuit className="h-4 w-4 text-primary" />
                     Executive Summary
                  </CardTitle>
                  <CardDescription className="text-xs">
                     Generated on {report ? new Date(report.generatedAt).toLocaleDateString() : '...'}
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  {isGenerating ? (
                      <div className="h-32 flex items-center justify-center text-muted-foreground gap-2 animate-pulse">
                          <Sparkles className="h-5 w-5" />
                          <span className="text-xs font-bold uppercase tracking-widest">Analyzing data...</span>
                      </div>
                  ) : (
                      <p className="text-lg font-medium leading-relaxed text-foreground/90">
                          {report?.summary}
                      </p>
                  )}
               </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/50 shadow-md">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Revenue</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black">${report?.metrics.revenue.value.toLocaleString()}</span>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 text-[10px]">
                                <ArrowUpRight className="h-3 w-3" /> {report?.metrics.revenue.change}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-md">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Bookings</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black">{report?.metrics.bookings.value}</span>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 text-[10px]">
                                <ArrowUpRight className="h-3 w-3" /> {report?.metrics.bookings.change}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-md">
                    <CardContent className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Sentiment Score</p>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black">{report?.metrics.sentiment.value}/100</span>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 text-[10px]">
                                <ArrowUpRight className="h-3 w-3" /> {report?.metrics.sentiment.change}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Card className="border-border/50 shadow-lg h-fit">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <FileText className="h-4 w-4 text-blue-500" />
                 Key Insights
              </CardTitle>
           </CardHeader>
           <CardContent>
              {isGenerating ? (
                  <div className="space-y-4">
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                  </div>
              ) : (
                  <ul className="space-y-4">
                      {report?.keyInsights.map((insight, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/20 border border-border/50">
                              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                              {insight}
                          </li>
                      ))}
                  </ul>
              )}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

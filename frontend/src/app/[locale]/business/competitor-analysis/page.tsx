'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { competitorApi, Competitor, CompetitorInsight } from '@/lib/api/competitors';
import { 
  RefreshCw, MapPin, Star, TrendingUp, TrendingDown, DollarSign, 
  Plus, Search, BarChart2, Target, AlertTriangle, Lightbulb 
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

export default function CompetitorAnalysisPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [insight, setInsight] = useState<CompetitorInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Add Competitor Form
  const [newCompetitor, setNewCompetitor] = useState<Partial<Competitor>>({
    name: '',
    type: 'Hotel',
    city: '',
    rating: 0,
    priceLevel: '$$'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [comps, aiInsight] = await Promise.all([
        competitorApi.getCompetitors(),
        competitorApi.getAiAnalysis()
      ]);
      setCompetitors(comps);
      setInsight(aiInsight);
    } catch (error) {
      toast.error("Failed to load competitor data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name) return toast.error("Name is required");
    setIsAdding(true);
    try {
      const added = await competitorApi.addCompetitor(newCompetitor);
      setCompetitors([...competitors, added]);
      toast.success("Competitor added manually");
      setNewCompetitor({ name: '', type: 'Hotel', city: '', rating: 0, priceLevel: '$$' });
    } catch (error) {
      toast.error("Failed to add competitor");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const found = await competitorApi.getNearbyCompetitors(5);
      setCompetitors([...competitors, ...found]);
      toast.success(`Found ${found.length} new competitors nearby`);
    } catch (error) {
      toast.error("Failed to detect competitors");
    } finally {
      setIsDetecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Chart Data Preparation
  const ratingsData = competitors.map(c => ({
    name: c.name,
    rating: c.rating,
    reviews: c.reviews
  }));

  const scatterData = competitors.map(c => ({
    x: c.priceLevel.length * 25, // Price score 25-100
    y: c.rating, // Rating 0-5
    z: c.reviews, // Bubble size
    name: c.name
  }));
  // Add "You" to scatter plot
  scatterData.push({ x: 85, y: 4.8, z: 1500, name: 'YOU' });

  const radarData = [
    { subject: 'Price', A: 80, B: 60, fullMark: 100 },
    { subject: 'Location', A: 90, B: 85, fullMark: 100 },
    { subject: 'Service', A: 85, B: 75, fullMark: 100 },
    { subject: 'Amenities', A: 70, B: 50, fullMark: 100 },
    { subject: 'Value', A: 60, B: 90, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Competitor Analysis</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            AI-powered market intelligence and benchmarking.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Dialog>
             <DialogTrigger asChild>
               <Button variant="outline" size="sm" className="h-9 text-xs uppercase font-bold tracking-widest">
                 <Plus className="h-3.5 w-3.5 mr-2" /> Add Competitor
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Add Competitor</DialogTitle>
                 <DialogDescription>Manually track a specific business.</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Name</Label>
                     <Input value={newCompetitor.name} onChange={e => setNewCompetitor({...newCompetitor, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Type</Label>
                     <Select value={newCompetitor.type} onValueChange={(val: any) => setNewCompetitor({...newCompetitor, type: val})}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Hotel">Hotel</SelectItem>
                         <SelectItem value="Restaurant">Restaurant</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>City</Label>
                   <Input value={newCompetitor.city} onChange={e => setNewCompetitor({...newCompetitor, city: e.target.value})} />
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleAddCompetitor} disabled={isAdding}>
                   {isAdding ? 'Adding...' : 'Add Competitor'}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>

           <Button variant="secondary" size="sm" onClick={handleAutoDetect} disabled={isDetecting} className="h-9 text-xs uppercase font-bold tracking-widest">
            <Search className={`h-3.5 w-3.5 mr-2 ${isDetecting ? 'animate-spin' : ''}`} /> 
            {isDetecting ? 'Scanning...' : 'Auto Detect Nearby'}
          </Button>
          
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
            Export Report
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      {insight && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-border/50 shadow-lg bg-gradient-to-br from-card to-muted/20">
             <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Lightbulb className="h-4 w-4 text-amber-500" />
                   AI Strategic Insights
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Competitive Advantage</h4>
                      <p className="text-sm text-emerald-900 dark:text-emerald-100">{insight.advantage}</p>
                   </div>
                   <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Market Opportunity</h4>
                      <p className="text-sm text-blue-900 dark:text-blue-100">{insight.opportunity}</p>
                   </div>
                </div>
                <div>
                   <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Recommended Actions</h4>
                   <div className="grid gap-2">
                      {insight.strategies.map((strat, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                           <Target className="h-4 w-4 text-primary shrink-0" />
                           <span className="text-sm">{strat}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
             <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Market Position</CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col items-center justify-center h-[300px]">
                <div className="text-center mb-6">
                   <span className="text-4xl font-black text-primary">{insight.yourRating}</span>
                   <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Your Rating</p>
                </div>
                <div className="w-full h-px bg-border mb-6" />
                <div className="text-center mb-6">
                   <span className="text-2xl font-bold text-muted-foreground">{insight.averageRating}</span>
                   <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Market Avg</p>
                </div>
                <Badge variant="outline" className="uppercase tracking-widest text-xs py-1 px-3">
                   {insight.marketPosition}
                </Badge>
             </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Positioning Map</CardTitle>
              <CardDescription className="text-xs">Price vs Quality Matrix</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="Price" unit="%" domain={[0, 100]} />
                    <YAxis type="number" dataKey="y" name="Rating" domain={[3, 5]} />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Reviews" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Competitors" data={scatterData} fill="var(--primary)" />
                 </ScatterChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Feature Comparison</CardTitle>
              <CardDescription className="text-xs">You vs Market Leader</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="You" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
                    <Radar name="Market" dataKey="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                    <Tooltip />
                 </RadarChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
         <Card className="border-border/50 shadow-lg">
            <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-widest">Competitor Benchmarking</CardTitle>
            </CardHeader>
            <CardContent>
               <DataTable 
                  title="Detailed Breakdown"
                  columns={[
                      { key: 'name', header: 'Competitor' },
                      { key: 'rating', header: 'Rating', cell: (row: any) => (
                          <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="font-bold">{row.rating}</span>
                              <span className="text-muted-foreground text-[10px]">({row.reviews})</span>
                          </div>
                      )},
                      { key: 'priceLevel', header: 'Price', cell: (row: any) => (
                          <span className="font-mono text-xs tracking-widest">{row.priceLevel}</span>
                      )},
                      { key: 'distance', header: 'Distance' },
                      { key: 'strengths', header: 'Strengths', cell: (row: any) => (
                          <div className="flex flex-wrap gap-1">
                              {row.strengths.map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-[9px] text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                                      {s}
                                  </Badge>
                              ))}
                          </div>
                      )},
                      { key: 'weaknesses', header: 'Weaknesses', cell: (row: any) => (
                          <div className="flex flex-wrap gap-1">
                              {row.weaknesses.map((w: string) => (
                                  <Badge key={w} variant="outline" className="text-[9px] text-rose-500 bg-rose-500/10 border-rose-500/20">
                                      {w}
                                  </Badge>
                              ))}
                          </div>
                      )},
                  ]}
                  data={competitors}
               />
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

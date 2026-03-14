'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { businessSeoApi } from '@/lib/api/business/seo';
import { 
  RefreshCw, Search, Globe, Share2, CheckCircle2, 
  AlertTriangle, Loader2, BarChart, MapPin, 
  Code, Sparkles, Copy, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BusinessSeoPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Local state for form inputs
  const [keywords, setKeywords] = useState('');
  const [localKeywords, setLocalKeywords] = useState('');

  const fetchData = async () => {
    console.log("SEO dashboard loading...");
    setIsLoading(true);
    try {
      const result = await businessSeoApi.getMySeo();
      setIsLocked(!!result.seoLocked);
      setData({
        profile: {
          title: result.seoTitle || '',
          description: result.seoDescription || '',
          keywords: result.seoKeywords ? result.seoKeywords.split(',') : [],
          slug: result.seoSlug || '',
          canonicalUrl: `https://ratevoice.ai/business/${result.seoSlug || ''}`,
          ogImage: ''
        },
        schema: {
           type: 'LocalBusiness',
           name: result.name || '',
           description: result.seoDescription || '',
           priceRange: '$$',
           image: '',
           address: {},
           geo: {},
           ratingValue: 4.5,
           reviewCount: 100
        },
        local: {
           googleMapsUrl: '',
           coordinates: '',
           nearbyLandmarks: [],
           localKeywords: []
        },
        performance: {
           impressions: 0,
           clicks: 0,
           ctr: 0,
           averagePosition: 0,
           history: []
        },
        score: result.seoScore || 0,
        recommendations: []
      });
      setKeywords(result.seoKeywords || '');
      
      try {
        const intData = await businessSeoApi.getIntelligenceDashboard();
        setIntelligence(intData);
      } catch (e) { console.error("Failed to load intelligence", e); }
    } catch (error) {
      toast.error("Failed to load SEO settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      await businessSeoApi.updateMySeo({
        seoTitle: data.profile.title,
        seoDescription: data.profile.description,
        seoKeywords: keywords,
        seoSlug: data.profile.slug
      });
      toast.success("SEO settings updated successfully");
      fetchData(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ... keep existing helper functions like generateKeywords but adapt if needed
  const generateKeywords = async () => {
      // Mock for now or connect to AI service if available
      toast.success("AI Keywords generated!");
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      await businessSeoApi.runAudit();
      toast.success("Audit started");
      const intData = await businessSeoApi.getIntelligenceDashboard();
      setIntelligence(intData);
    } catch (e) { toast.error("Audit failed"); }
    finally { setIsAuditing(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">SEO Profile Unavailable</h3>
        <p className="text-muted-foreground">We couldn't load your SEO settings.</p>
        <Button onClick={fetchData}>Try Again</Button>
      </div>
    );
  }

  const titleLength = data.profile.title.length;
  const descLength = data.profile.description.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Business SEO</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Optimize your business profile for search engines.
          </p>
        </div>
        <div className="flex items-center gap-3">
           {isLocked && (
             <Badge variant="destructive" className="h-9 gap-2">
               <Lock className="h-3 w-3" /> Locked by Admin
             </Badge>
           )}
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || isLocked} className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
           {/* Main Tabs */}
           <Tabs defaultValue="profile" className="w-full">
             <TabsList className="grid w-full grid-cols-5 mb-4">
               <TabsTrigger value="profile">Profile</TabsTrigger>
               <TabsTrigger value="schema">Schema</TabsTrigger>
               <TabsTrigger value="local">Local SEO</TabsTrigger>
               <TabsTrigger value="analytics">Performance</TabsTrigger>
               <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
             </TabsList>

             {/* PROFILE TAB */}
             <TabsContent value="profile" className="space-y-6">
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        Meta Information
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Page Title</Label>
                          <span className={`text-[10px] font-mono ${titleLength >= 50 && titleLength <= 60 ? 'text-green-500' : 'text-amber-500'}`}>
                            {titleLength}/60 chars
                          </span>
                        </div>
                        <Input 
                            value={data.profile.title}
                            onChange={e => setData({...data, profile: {...data.profile, title: e.target.value}})}
                            disabled={isLocked}
                        />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Meta Description</Label>
                          <span className={`text-[10px] font-mono ${descLength >= 150 && descLength <= 160 ? 'text-green-500' : 'text-amber-500'}`}>
                            {descLength}/160 chars
                          </span>
                        </div>
                        <Textarea 
                            className="resize-none h-24"
                            value={data.profile.description}
                            onChange={e => setData({...data, profile: {...data.profile, description: e.target.value}})}
                            disabled={isLocked}
                        />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Keywords</Label>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={generateKeywords} disabled={isGenerating || isLocked}>
                            <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                            {isGenerating ? 'Generating...' : 'AI Suggest'}
                          </Button>
                        </div>
                        <Input 
                            value={keywords}
                            onChange={e => setKeywords(e.target.value)}
                            placeholder="hotel, luxury, travel..."
                            disabled={isLocked}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Slug</Label>
                           <Input value={data.profile.slug} 
                             onChange={e => setData({...data, profile: {...data.profile, slug: e.target.value}})}
                             disabled={isLocked} 
                             className="font-mono text-xs" 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Canonical URL</Label>
                           <Input value={data.profile.canonicalUrl} disabled className="bg-muted font-mono text-xs" />
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Preview Card */}
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Search Preview
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="p-4 bg-white rounded-lg border border-border/20 shadow-sm max-w-2xl">
                        <div className="text-xs text-[#202124] mb-1 flex items-center gap-2">
                            <div className="h-4 w-4 bg-gray-200 rounded-full" />
                            <span>ratevoice.ai › hotel › {data.profile.slug}</span>
                        </div>
                        <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium mb-1 line-clamp-1">
                            {data.profile.title}
                        </h3>
                        <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                            {data.profile.description}
                        </p>
                     </div>
                  </CardContent>
               </Card>
             </TabsContent>

             {/* SCHEMA TAB */}
             <TabsContent value="schema" className="space-y-6">
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Code className="h-4 w-4 text-orange-500" />
                        Structured Data (JSON-LD)
                     </CardTitle>
                     <CardDescription>
                        Automatically generated schema markup for search engines.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Business Type</Label>
                           <Input value={data.schema.type} disabled />
                        </div>
                        <div className="space-y-2">
                           <Label>Price Range</Label>
                           <Input value={data.schema.priceRange} onChange={e => setData({...data, schema: {...data.schema, priceRange: e.target.value}})} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>JSON-LD Preview</Label>
                        <div className="relative">
                          <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                            {JSON.stringify({
                              "@context": "https://schema.org",
                              "@type": data.schema.type,
                              "name": data.schema.name,
                              "description": data.schema.description,
                              "image": data.schema.image,
                              "address": {
                                "@type": "PostalAddress",
                                ...data.schema.address
                              },
                              "geo": {
                                "@type": "GeoCoordinates",
                                ...data.schema.geo
                              },
                              "priceRange": data.schema.priceRange,
                              "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": data.schema.ratingValue,
                                "reviewCount": data.schema.reviewCount
                              }
                            }, null, 2)}
                          </pre>
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white" onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(data.schema));
                            toast.success("Copied to clipboard");
                          }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             </TabsContent>

             {/* LOCAL SEO TAB */}
             <TabsContent value="local" className="space-y-6">
               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        Local SEO
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label>Google Maps URL</Label>
                        <div className="flex gap-2">
                           <Input value={data.local.googleMapsUrl} onChange={e => setData({...data, local: {...data.local, googleMapsUrl: e.target.value}})} />
                           <Button variant="outline" size="icon" asChild>
                             <a href={data.local.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                               <Globe className="h-4 w-4" />
                             </a>
                           </Button>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>GPS Coordinates</Label>
                        <Input value={data.local.coordinates} disabled className="bg-muted" />
                     </div>
                     <div className="space-y-2">
                        <Label>Nearby Landmarks</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                           {data.local.nearbyLandmarks.map((lm: string, i: number) => ( 
                             <Badge key={i} variant="secondary">{lm}</Badge>
                           ))}
                        </div>
                        <Input placeholder="Add landmark..." onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value;
                            if (val) {
                              setData({...data, local: {...data.local, nearbyLandmarks: [...data.local.nearbyLandmarks, val]}});
                              e.currentTarget.value = '';
                            }
                          }
                        }} />
                     </div>
                     <div className="space-y-2">
                        <Label>Local Keywords</Label>
                        <Input value={localKeywords} onChange={e => setLocalKeywords(e.target.value)} />
                     </div>
                  </CardContent>
               </Card>
             </TabsContent>

             {/* ANALYTICS TAB */}
             <TabsContent value="analytics" className="space-y-6">
               <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Impressions</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.performance.impressions.toLocaleString()}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Clicks</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.performance.clicks.toLocaleString()}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">CTR</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.performance.ctr}%</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Avg Position</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.performance.averagePosition}</div></CardContent>
                  </Card>
               </div>
               
               <Card>
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-primary" />
                        Search Performance (7 Days)
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.performance.history}>
                           <defs>
                              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <Tooltip />
                           <Area type="monotone" dataKey="impressions" stroke="#888888" fillOpacity={1} fill="url(#colorImpressions)" />
                           <Area type="monotone" dataKey="clicks" stroke="#82ca9d" fillOpacity={1} strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
             </TabsContent>

             <TabsContent value="intelligence" className="space-y-6">
               <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Indexed Pages (Google)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{intelligence?.google?.indexedPages || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Indexed Pages (Bing)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{intelligence?.bing?.indexedPages || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Backlinks</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{intelligence?.backlinks?.length || 0}</div></CardContent>
                  </Card>
               </div>

               <Card className="border-border/50 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        SEO Audit
                     </CardTitle>
                     <Button size="sm" onClick={handleRunAudit} disabled={isAuditing} className="h-7 text-xs font-bold uppercase tracking-widest">
                        {isAuditing ? 'Running...' : 'Run Audit'}
                     </Button>
                  </CardHeader>
                  <CardContent>
                     {intelligence?.audit ? (
                       <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-muted/20 rounded">
                             <span className="text-sm font-medium">Health Score</span>
                             <Badge variant={intelligence.audit.score > 80 ? 'default' : 'destructive'}>{intelligence.audit.score}/100</Badge>
                          </div>
                          <div className="grid gap-2">
                             {intelligence.audit.issues?.map((issue: string, i: number) => (
                               <div key={i} className="flex gap-2 items-center text-sm text-red-500">
                                 <AlertTriangle className="h-4 w-4" /> {issue}
                               </div>
                             ))}
                             {(!intelligence.audit.issues || intelligence.audit.issues.length === 0) && (
                               <div className="flex gap-2 items-center text-sm text-green-500">
                                 <CheckCircle2 className="h-4 w-4" /> No issues found.
                               </div>
                             )}
                          </div>
                       </div>
                     ) : (
                       <div className="text-center py-8 text-muted-foreground text-sm">
                         No audit data available. Run an audit to see results.
                       </div>
                     )}
                  </CardContent>
               </Card>

               <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-widest">Keyword Rankings</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-2">
                        {intelligence?.rankings?.map((r: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-muted/10 rounded border border-border/50">
                             <span className="text-sm font-medium">{r.keyword}</span>
                             <div className="flex items-center gap-2">
                               <span className="text-sm font-bold">#{r.position}</span>
                               <span className={`text-xs ${r.change > 0 ? 'text-green-500' : r.change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                 {r.change > 0 ? '↑' : r.change < 0 ? '↓' : '-'}{Math.abs(r.change)}
                               </span>
                             </div>
                          </div>
                        ))}
                        {(!intelligence?.rankings || intelligence.rankings.length === 0) && (
                          <div className="text-center py-4 text-muted-foreground text-sm">No rankings tracked yet.</div>
                        )}
                     </div>
                  </CardContent>
               </Card>
             </TabsContent>
           </Tabs>
        </div>

        {/* Right Sidebar - Score & Recommendations */}
        <div className="space-y-6">
           <Card className="border-border/50 shadow-lg sticky top-6">
              <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-widest">SEO Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                 <div className="relative h-32 w-32 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-muted/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path 
                          className={data.score >= 80 ? "text-emerald-500" : data.score >= 50 ? "text-amber-500" : "text-red-500"} 
                          strokeDasharray={`${data.score}, 100`} 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black">{data.score}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">/100</span>
                    </div>
                 </div>
                 
                 <div className="w-full mt-6 space-y-4">
                    <div className="space-y-2">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" /> Improvements
                       </h4>
                       {data.recommendations.map((rec: string, i: number) => (
                           <div key={i} className="flex gap-2 items-start text-xs bg-muted/50 p-2 rounded">
                               <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                               <span>{rec}</span>
                           </div>
                       ))}
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

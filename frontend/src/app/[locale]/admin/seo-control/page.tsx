'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminSeoApi, SEOData } from '@/lib/api/admin/seo';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { MoreHorizontal, Shield, Lock, Unlock, CheckCircle, XCircle, Search, ShieldAlert } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatsCard } from '@/components/stats-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminSeoPage() {
  const [businesses, setBusinesses] = useState<SEOData[]>([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, pending: 0, locked: 0, flagged: 0 });
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [generatedPages, setGeneratedPages] = useState<any[]>([]);
  const [pageGenData, setPageGenData] = useState({ city: '', category: 'Hotel' });

  const fetchData = async () => {
    try {
      const data = await adminSeoApi.getAllBusinessSeo();
      setBusinesses(data);
      
      const total = data.length;
      const avgScore = total > 0 ? data.reduce((acc, curr) => acc + curr.score, 0) / total : 0;
      const pending = data.filter(b => !b.approved).length;
      const locked = data.filter(b => b.locked).length;
      const flagged = data.filter(b => b.flagged).length;
      
      setStats({ total, avgScore, pending, locked, flagged });

      const settings = await adminSeoApi.getGlobalSettings();
      setGlobalSettings(settings);
      const pages = await adminSeoApi.getPages();
      setGeneratedPages(pages);
    } catch (error) {
      toast.error('Failed to load SEO data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'lock' | 'unlock') => {
    try {
      if (action === 'approve') await adminSeoApi.approveSeo(id);
      if (action === 'reject') await adminSeoApi.rejectSeo(id);
      if (action === 'lock') await adminSeoApi.lockSeo(id);
      if (action === 'unlock') await adminSeoApi.unlockSeo(id);
      
      toast.success(`Action ${action} successful`);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleGlobalSave = async () => {
      try {
          await adminSeoApi.updateGlobalSettings(globalSettings);
          toast.success("Global settings updated");
      } catch (e) { toast.error("Failed"); }
  }

  const handleGeneratePage = async () => {
      try {
          await adminSeoApi.generatePage(pageGenData);
          toast.success("Page generated");
          fetchData();
      } catch (e) { toast.error("Failed"); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SEO Control Center</h1>
      
      <Tabs defaultValue="monitoring">
        <TabsList>
            <TabsTrigger value="monitoring">Business Monitoring</TabsTrigger>
            <TabsTrigger value="global">Global Settings</TabsTrigger>
            <TabsTrigger value="generator">Page Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
            <div className="grid gap-4 md:grid-cols-5 mb-6">
                <StatsCard title="Total Businesses" value={stats.total} icon={Search} description="With SEO Profile" />
                <StatsCard title="Avg SEO Score" value={stats.avgScore.toFixed(0)} icon={Shield} description="Platform Health" />
                <StatsCard title="Pending Approval" value={stats.pending} icon={CheckCircle} description="Needs Review" />
                <StatsCard title="Locked Profiles" value={stats.locked} icon={Lock} description="Restricted Access" />
                <StatsCard title="Spam Detected" value={stats.flagged} icon={ShieldAlert} description="Requires Action" />
            </div>

            <Card>
                <CardContent className="p-0">
                <DataTable
                    columns={[
                    { key: 'title', header: 'Business / Title', cell: (row: any) => (
                        <div>
                            <div className="font-bold flex items-center gap-2">
                            {row.title}
                            {row.flagged && <Badge variant="destructive" className="h-5 px-1 text-[10px]">SPAM</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.pageUrl}</div>
                        </div>
                    )},
                    { key: 'score', header: 'Score', cell: (row: any) => (
                        <div className="flex items-center gap-2">
                            <div className={`text-lg font-bold ${row.score > 80 ? 'text-green-500' : row.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                {row.score}
                            </div>
                        </div>
                    )},
                    { key: 'status', header: 'Status', cell: (row: any) => (
                        <div className="flex gap-1">
                            {row.approved ? <Badge className="bg-green-500">Approved</Badge> : <Badge variant="outline">Pending</Badge>}
                            {row.locked && <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
                        </div>
                    )},
                    { key: 'lastUpdated', header: 'Last Edit', cell: (row: any) => new Date(row.lastUpdated).toLocaleDateString() },
                    { key: 'actions', header: '', cell: (row: any) => (
                        <DropdownMenu>
                        <DropdownMenuTrigger><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {!row.approved && <DropdownMenuItem onClick={() => handleAction(row.id, 'approve')}><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve</DropdownMenuItem>}
                            {row.approved && <DropdownMenuItem onClick={() => handleAction(row.id, 'reject')}><XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject</DropdownMenuItem>}
                            {!row.locked && <DropdownMenuItem onClick={() => handleAction(row.id, 'lock')}><Lock className="mr-2 h-4 w-4 text-amber-500" /> Lock</DropdownMenuItem>}
                            {row.locked && <DropdownMenuItem onClick={() => handleAction(row.id, 'unlock')}><Unlock className="mr-2 h-4 w-4 text-blue-500" /> Unlock</DropdownMenuItem>}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    ]}
                    data={businesses}
                />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="global">
            <Card>
                <CardHeader><CardTitle>Global Metadata</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Default Meta Title</Label>
                        <Input value={globalSettings?.defaultTitle} onChange={e => setGlobalSettings({...globalSettings, defaultTitle: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Default Meta Description</Label>
                        <Textarea value={globalSettings?.defaultDescription} onChange={e => setGlobalSettings({...globalSettings, defaultDescription: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Global Keywords</Label>
                        <Input value={globalSettings?.globalKeywords} onChange={e => setGlobalSettings({...globalSettings, globalKeywords: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Robots.txt</Label>
                        <Textarea className="font-mono h-32" value={globalSettings?.robotsTxt} onChange={e => setGlobalSettings({...globalSettings, robotsTxt: e.target.value})} />
                    </div>
                    <Button onClick={handleGlobalSave}>Save Global Settings</Button>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="generator">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Generate Landing Page</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input value={pageGenData.city} onChange={e => setPageGenData({...pageGenData, city: e.target.value})} placeholder="Casablanca" />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={pageGenData.category} onValueChange={(v: string) => setPageGenData({...pageGenData, category: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hotel">Hotel</SelectItem>
                                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGeneratePage}>Generate Page</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Generated Pages</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {generatedPages.map(page => (
                                <div key={page.id} className="p-2 border rounded flex justify-between">
                                    <span className="font-mono text-sm">/{page.slug}</span>
                                    <Badge variant="outline">{page.city}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adsApi, AdCampaign } from '@/lib/api/ads';
import { RefreshCw, Megaphone, TrendingUp, MousePointer, Eye, Loader2, PlayCircle, PauseCircle } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function AdsManagementPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New Campaign Form State
  const [newCampaign, setNewCampaign] = useState<{
    name: string;
    type: 'cpc' | 'duration';
    budget: string;
    targetLocation: string;
  }>({
    name: '',
    type: 'cpc',
    budget: '',
    targetLocation: ''
  });

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await adsApi.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.budget) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsCreating(true);
    try {
      await adsApi.createCampaign({ ...newCampaign, budget: Number(newCampaign.budget) });
      toast.success("Campaign created successfully");
      setNewCampaign({ name: '', type: 'cpc', budget: '', targetLocation: '' });
      fetchCampaigns();
    } catch (error) {
      toast.error("Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const performanceData = campaigns.map(c => ({
    name: c.name,
    clicks: c.clicks,
    impressions: c.impressions / 100 // Scale down for visualization
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Ads Management</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Create and optimize your advertising campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchCampaigns} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <Megaphone className="h-4 w-4 text-primary" />
                 Create Campaign
              </CardTitle>
           </CardHeader>
           <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Campaign Name</Label>
                    <Input 
                        placeholder="e.g. Summer Special" 
                        value={newCampaign.name}
                        onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Type</Label>
                    <Select 
                        value={newCampaign.type} 
                        onValueChange={(val) => setNewCampaign({...newCampaign, type: val as any})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cpc">CPC (Cost Per Click)</SelectItem>
                            <SelectItem value="duration">Fixed Duration</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Budget ($)</Label>
                    <Input 
                        type="number"
                        placeholder="500" 
                        value={newCampaign.budget}
                        onChange={e => setNewCampaign({...newCampaign, budget: e.target.value})}
                    />
                 </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Target Location</Label>
                    <Input 
                        placeholder="e.g. New York, Paris" 
                        value={newCampaign.targetLocation}
                        onChange={e => setNewCampaign({...newCampaign, targetLocation: e.target.value})}
                    />
                 </div>
                 <Button type="submit" disabled={isCreating} className="w-full uppercase font-bold tracking-widest text-xs mt-2">
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Launch Campaign'}
                 </Button>
              </form>
           </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="h-4 w-4 text-emerald-500" />
                 Performance Overview
              </CardTitle>
           </CardHeader>
           <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                        dataKey="name" 
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
                    <Bar dataKey="clicks" name="Clicks" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="impressions" name="Impressions (x100)" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} opacity={0.3} />
                 </BarChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
         <DataTable 
            title="Active Campaigns"
            columns={[
                { key: 'name', header: 'Campaign' },
                { key: 'status', header: 'Status', cell: (row: any) => (
                    <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-widest">
                        {row.status}
                    </Badge>
                )},
                { key: 'type', header: 'Type', cell: (row: any) => <span className="uppercase text-xs font-mono">{row.type}</span> },
                { key: 'budget', header: 'Budget', cell: (row: any) => `$${row.budget}` },
                { key: 'spent', header: 'Spent', cell: (row: any) => `$${row.spent}` },
                { key: 'impressions', header: 'Impressions', cell: (row: any) => (
                    <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        {row.impressions.toLocaleString()}
                    </div>
                )},
                { key: 'clicks', header: 'Clicks', cell: (row: any) => (
                    <div className="flex items-center gap-1">
                        <MousePointer className="h-3 w-3 text-muted-foreground" />
                        {row.clicks.toLocaleString()}
                    </div>
                )},
                { key: 'actions', header: 'Actions', className: 'text-right', cell: (row: any) => (
                    <div className="flex justify-end gap-2">
                        {row.status === 'active' ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10">
                                <PauseCircle className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10">
                                <PlayCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )},
            ]}
            data={campaigns}
         />
      </div>
    </div>
  );
}

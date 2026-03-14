'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminReputationApi, ReputationOverride } from '@/lib/api/admin/reputation';
import { RefreshCw, Star, ShieldAlert, History, ArrowRight, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ReputationControlPage() {
  const [overrides, setOverrides] = useState<ReputationOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  
  // Form State
  const [businessId, setBusinessId] = useState('');
  const [score, setScore] = useState('');
  const [reason, setReason] = useState('');

  const fetchOverrides = async () => {
    setIsLoading(true);
    try {
      const data = await adminReputationApi.getOverrides();
      setOverrides(data);
    } catch (error) {
      toast.error("Failed to load reputation overrides");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !score || !reason) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsApplying(true);
    try {
      await adminReputationApi.applyOverride(businessId, Number(score), reason);
      toast.success("Reputation score updated");
      setBusinessId('');
      setScore('');
      setReason('');
      fetchOverrides();
    } catch (error) {
      toast.error("Failed to apply override");
    } finally {
      setIsApplying(false);
    }
  };

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
          <h1 className="text-3xl font-black uppercase tracking-tight">Reputation Control</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manually adjust and override business reputation scores.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchOverrides} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,2fr]">
        <Card className="border-border/50 shadow-lg h-fit bg-gradient-to-br from-card to-amber-500/5">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <ShieldAlert className="h-4 w-4 text-amber-500" />
                 Override Score
              </CardTitle>
              <CardDescription className="text-xs">
                 Force update a business's reputation score. Use with caution.
              </CardDescription>
           </CardHeader>
           <CardContent>
              <form onSubmit={handleApply} className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Business ID</Label>
                    <Input 
                        placeholder="e.g. BUS-123" 
                        value={businessId}
                        onChange={e => setBusinessId(e.target.value)}
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">New Score (0-10)</Label>
                    <Input 
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="9.5" 
                        value={score}
                        onChange={e => setScore(e.target.value)}
                    />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Reason for Adjustment</Label>
                    <Textarea 
                        placeholder="Explain why this adjustment is necessary..." 
                        className="resize-none h-24"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                 </div>

                 <Button type="submit" disabled={isApplying} className="w-full uppercase font-bold tracking-widest text-xs h-10 bg-amber-600 hover:bg-amber-700">
                    {isApplying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                    {isApplying ? 'Applying...' : 'Apply Override'}
                 </Button>
              </form>
           </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="border-border/50 shadow-lg">
              <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-500" />
                    Override History
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <DataTable 
                    title=""
                    columns={[
                        { key: 'businessName', header: 'Business' },
                        { key: 'overrideScore', header: 'Adjustment', cell: (row: any) => (
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <span className="text-muted-foreground">{row.originalScore}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="font-bold text-amber-500">{row.overrideScore}</span>
                            </div>
                        )},
                        { key: 'reason', header: 'Reason', cell: (row: any) => (
                            <span className="text-xs text-muted-foreground italic truncate max-w-[200px] block">
                                "{row.reason}"
                            </span>
                        )},
                        { key: 'status', header: 'Status', cell: (row: any) => (
                            <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[9px] tracking-widest">
                                {row.status}
                            </Badge>
                        )},
                        { key: 'updatedAt', header: 'Date', className: 'text-right text-xs text-muted-foreground' },
                    ]}
                    data={overrides}
                 />
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { subscriptionApi, SubscriptionPlan, BillingHistory } from '@/lib/api/subscription';
import { RefreshCw, Check, Zap, Download, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';

export default function SubscriptionPlanPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<BillingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansData, historyData] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getBillingHistory()
      ]);
      setPlans(plansData);
      setHistory(historyData);
    } catch (error) {
      toast.error("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(planId);
    try {
      await subscriptionApi.upgradePlan(planId);
      toast.success("Plan upgraded successfully!");
      fetchData();
    } catch (error) {
      toast.error("Upgrade failed. Please try again.");
    } finally {
      setIsUpgrading(null);
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
          <h1 className="text-3xl font-black uppercase tracking-tight">Subscription Plan</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage your subscription and billing details.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        {plans.map((plan) => (
            <Card 
                key={plan.id} 
                className={`relative flex flex-col border-2 transition-all duration-300 ${
                    plan.isCurrent ? 'border-primary shadow-xl bg-primary/5' : 
                    plan.recommended ? 'border-amber-500 shadow-lg scale-105 z-10' : 
                    'border-border/50 hover:border-primary/50'
                }`}
            >
                {plan.recommended && !plan.isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                        Recommended
                    </div>
                )}
                {plan.isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                        Current Plan
                    </div>
                )}
                
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-bold uppercase tracking-widest">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1 mt-2">
                        <span className="text-3xl font-black">${plan.price}</span>
                        <span className="text-muted-foreground text-xs uppercase font-bold">/mo</span>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1">
                    <ul className="space-y-3 mt-4">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                
                <CardFooter>
                    <Button 
                        className="w-full uppercase font-bold tracking-widest text-xs" 
                        variant={plan.isCurrent ? "outline" : "default"}
                        disabled={plan.isCurrent || isUpgrading === plan.id}
                        onClick={() => handleUpgrade(plan.id)}
                    >
                        {isUpgrading === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                         plan.isCurrent ? 'Active' : 'Upgrade'}
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </div>

      <div className="space-y-6">
         <Card className="border-border/50 shadow-lg">
            <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Billing History
               </CardTitle>
            </CardHeader>
            <CardContent>
               <DataTable 
                  title=""
                  columns={[
                      { key: 'date', header: 'Date', cell: (row: any) => new Date(row.date).toLocaleDateString() },
                      { key: 'id', header: 'Invoice ID' },
                      { key: 'amount', header: 'Amount', cell: (row: any) => `$${row.amount.toFixed(2)}` },
                      { key: 'status', header: 'Status', cell: (row: any) => (
                          <Badge variant={row.status === 'paid' ? 'outline' : 'destructive'} className="uppercase text-[10px] tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              {row.status}
                          </Badge>
                      )},
                      { key: 'actions', header: '', className: 'w-[100px] text-right', cell: (row: any) => (
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                              <Download className="h-3.5 w-3.5" /> PDF
                          </Button>
                      )},
                  ]}
                  data={history}
               />
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

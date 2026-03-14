'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Star } from 'lucide-react';
import Link from 'next/link';
import { subscriptionApi, SubscriptionPlan, BillingHistory } from '@/lib/api/subscription';

export default function SubscriptionSettingsPage() {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [history, setHistory] = useState<BillingHistory[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const plans = await subscriptionApi.getPlans();
        setPlan(plans.find((p) => p.isCurrent) || null);
      } catch {}
      try {
        setHistory(await subscriptionApi.getBillingHistory());
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Subscription</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and billing details.
        </p>
      </div>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Current Plan: {plan?.name || 'None'}</CardTitle>
              <CardDescription>
                {plan ? `You are currently on the ${plan.name} plan.` : 'No active subscription found.'}
              </CardDescription>
            </div>
            <Badge className="text-sm px-3 py-1">{plan ? 'Active' : 'Pending'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(plan?.features || []).slice(0, 6).map((f) => (
            <div key={f} className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{f}</span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/business/subscription-plan">Upgrade Plan</Link>
          </Button>
          <Button variant="ghost" className="text-muted-foreground">
            Cancel Subscription
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payment history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Invoice #{h.id}</p>
                    <p className="text-sm text-muted-foreground">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${h.amount.toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs">{h.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

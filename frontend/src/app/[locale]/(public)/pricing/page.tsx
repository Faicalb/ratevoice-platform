'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/contexts/currency-context';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function PricingPage() {
  const t = useTranslations('Pricing');
  const { format, convert } = useCurrency();

  const plans = [
    {
      key: 'free',
      price: 0,
      customPrice: false
    },
    {
      key: 'professional',
      price: 29,
      customPrice: false
    },
    {
      key: 'enterprise',
      price: 0,
      customPrice: true
    }
  ];

  return (
    <div className="app-container py-24">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground">
          {t('professional.name')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl lg:max-w-3xl xxl:max-w-4xl">
          Unlock the power of AI intelligence for your hospitality business.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.key} className="glass-card flex flex-col hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold uppercase tracking-widest text-primary">
                {t(`${plan.key}.name`)}
              </CardTitle>
              <CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  {plan.customPrice ? (
                    <span className="text-3xl font-black text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-foreground">
                        {format(convert(plan.price))}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">/ month</span>
                    </>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <FeatureList planKey={plan.key} />
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest">
                Get Started
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FeatureList({ planKey }: { planKey: string }) {
  const t = useTranslations(`Pricing.${planKey}`);
  const featureCount = planKey === 'free' ? 3 : 5;
  
  return (
    <>
      {Array.from({ length: featureCount }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">{t(`features.${i}`)}</span>
        </li>
      ))}
    </>
  );
}

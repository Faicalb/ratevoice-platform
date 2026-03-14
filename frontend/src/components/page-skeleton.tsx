'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export default function PageSkeleton({ title, description, icon: Icon, children }: PageProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            {title}
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest">
            Action
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {children || (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Content Area</CardTitle>
              <CardDescription className="text-xs">
                Waiting for API integration...
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              <p className="text-xs font-mono uppercase">Loading Data Stream...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

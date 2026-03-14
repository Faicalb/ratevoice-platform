'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function PlaceholderAdminPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="p-4 bg-slate-900 rounded-full">
        <Construction className="h-12 w-12 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-white">Under Construction</h1>
      <p className="text-slate-400">This admin module is currently being built.</p>
    </div>
  );
}

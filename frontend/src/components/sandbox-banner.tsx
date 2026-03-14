'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function SandboxBanner() {
  const isSandbox = process.env.NEXT_PUBLIC_APP_ENV === 'sandbox';
  const isDevBypass = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  if (!isSandbox && !isDevBypass) return null;

  return (
    <div className="flex flex-col sticky top-0 z-50">
      {isSandbox && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-3 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">
            Sandbox Mode Active — Test Data Only
          </span>
        </div>
      )}
      {isDevBypass && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1 flex items-center justify-center gap-3 backdrop-blur-sm">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">
            ⚠ DEVELOPMENT MODE ACTIVE – AUTHENTICATION BYPASSED
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-slate-100 font-sans relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(120,50,50,0.1),transparent_50%)]" />
      </div>
      
      <div className="app-container relative z-10 py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="hidden lg:block space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Admin Console
              </p>
              <h1 className="text-4xl font-black tracking-tight">
                Monitor and control the full platform.
              </h1>
              <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                Access administrative tools for users, businesses, security alerts, and system operations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-bold text-white">Real-time oversight</p>
                <p className="text-xs text-slate-400 mt-1">Dashboards and live controls.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-bold text-white">Audit-ready</p>
                <p className="text-xs text-slate-400 mt-1">Clear logs and structured data.</p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md justify-self-center lg:justify-self-end px-4"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

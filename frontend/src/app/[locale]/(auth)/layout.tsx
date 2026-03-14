import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] relative overflow-hidden selection:bg-blue-500/30">
      {/* Mesh Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="app-container relative z-10 py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="hidden lg:block space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                RateVoice Platform
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white">
                AI hospitality intelligence, built for scale.
              </h1>
              <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                Sign in to manage reviews, bookings, and performance insights across all your locations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-bold text-white">Responsive dashboards</p>
                <p className="text-xs text-slate-400 mt-1">Optimized for desktop and mobile.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-bold text-white">Secure access</p>
                <p className="text-xs text-slate-400 mt-1">Modern auth and role controls.</p>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

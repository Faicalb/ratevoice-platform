'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api/api';
import { Loader2, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Assuming backend endpoint exists
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      // Check for admin role
      if (!user.roles || !user.roles.includes('SUPER_ADMIN')) {
          toast.error('Access Denied. Super Admin privileges required.');
          setIsLoading(false);
          return;
      }

      login(access_token, user, '/admin');
      toast.success('Welcome back, Administrator.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials or access denied.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-[#0A0A0A] border-red-900/20 shadow-2xl shadow-red-900/10 backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center pb-8 pt-8">
        <div className="mx-auto bg-red-900/10 p-4 rounded-full mb-4 w-fit border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <ShieldCheck className="h-10 w-10 text-red-500" />
        </div>
        <CardTitle className="text-2xl font-black text-white uppercase tracking-widest">
            Root Access
        </CardTitle>
        <CardDescription className="text-red-400/60 font-mono text-xs tracking-wider flex items-center justify-center gap-2">
            <Lock className="h-3 w-3" />
            SECURE SYSTEM ENTRY POINT
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Administrator ID</label>
            <Input
              type="email"
              placeholder="admin@ratevoice.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#141414] border-red-900/20 text-white placeholder:text-zinc-700 h-12 px-4 focus:border-red-500/50 focus:ring-red-500/20 font-mono text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Passcode</label>
            </div>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#141414] border-red-900/20 text-white placeholder:text-zinc-700 h-12 px-4 focus:border-red-500/50 focus:ring-red-500/20 font-mono text-sm tracking-widest"
              required
            />
          </div>
          
          <div className="pt-2">
            <Button 
                type="submit" 
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] shadow-lg shadow-red-900/20"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Authenticate Session
            </Button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-red-900/10 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-red-500/40">
                <AlertTriangle className="h-3 w-3" />
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
                    Unauthorized access is prohibited
                </p>
            </div>
            <p className="text-[9px] text-zinc-700 font-mono">
                IP: {typeof window !== 'undefined' ? 'Logged' : '...'} • Time: {new Date().toISOString().split('T')[1].split('.')[0]}
            </p>
        </div>
      </CardContent>
    </Card>
  );
}

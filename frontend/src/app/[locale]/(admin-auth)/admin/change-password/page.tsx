'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api/api';
import { Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
    }
    
    setIsLoading(true);

    try {
      // Simulate backend call if user.id is missing (should not happen if logged in)
      if (!user?.id) throw new Error('User ID not found');

      // Call backend to update password
      // Since we don't have a dedicated endpoint confirmed, we might need to assume one.
      // Assuming PUT /users/:id works as user update.
      await api.put(`/users/${user.id}`, { 
          password, 
          mustChangePassword: false 
      });
      
      toast.success('Password updated successfully. Please login again.');
      logout();
    } catch (error) {
      toast.error('Failed to update password.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-[#0A0A0A] border-yellow-900/20 shadow-2xl shadow-yellow-900/10 backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center pb-8 pt-8">
        <div className="mx-auto bg-yellow-900/10 p-4 rounded-full mb-4 w-fit border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <KeyRound className="h-10 w-10 text-yellow-500" />
        </div>
        <CardTitle className="text-xl font-black text-white uppercase tracking-widest">
            Security Update Required
        </CardTitle>
        <CardDescription className="text-yellow-400/60 font-mono text-xs tracking-wider flex items-center justify-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            TEMPORARY PASSWORD DETECTED
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">New Secure Password</label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#141414] border-yellow-900/20 text-white placeholder:text-zinc-700 h-12 px-4 focus:border-yellow-500/50 focus:ring-yellow-500/20 font-mono text-sm tracking-widest"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#141414] border-yellow-900/20 text-white placeholder:text-zinc-700 h-12 px-4 focus:border-yellow-500/50 focus:ring-yellow-500/20 font-mono text-sm tracking-widest"
              required
            />
          </div>
          
          <div className="pt-2">
            <Button 
                type="submit" 
                className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-black font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] shadow-lg shadow-yellow-900/20"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Set Permanent Password'}
            </Button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-yellow-900/10 text-center space-y-2">
            <p className="text-[9px] text-zinc-600 font-mono">
                Your account is locked until this step is completed.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}

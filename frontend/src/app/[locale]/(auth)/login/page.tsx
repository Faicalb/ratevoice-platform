'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api/api';
import { Link, useRouter } from '@/i18n/routing';
import { Loader2, BrainCircuit, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      const { access_token, user } = response.data;
      login(access_token, user);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-[#141414] border-slate-800/50 rounded-[32px] overflow-hidden shadow-2xl shadow-black/50">
        <CardHeader className="space-y-6 pt-10 pb-8 px-10 text-center border-b border-slate-800/50">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-600 rounded-2xl p-3 shrink-0 shadow-lg shadow-blue-600/20">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter italic">RateVoice</CardTitle>
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">AI Strategic Node</span>
              </div>
            </div>
          </div>
          <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mx-auto max-w-xs sm:max-w-sm leading-relaxed">
            Enter authorized credentials to access the intelligence mesh.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@ratevoice.ai" 
                        {...field} 
                        className="h-12 bg-[#0D0D0D] border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key (Password)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="h-12 bg-[#0D0D0D] border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                  </FormItem>
                )}
              />
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                  Error: {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-600/20 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authorizing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Initialize Session</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center pb-10 px-10">
          <div className="h-px w-full bg-slate-800/50" />
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            New node request?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-400 transition-colors ml-1">
              Create Account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

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
import { Loader2, BrainCircuit, ArrowRight, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password confirmation is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Register
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });

      // 2. Auto-login after successful registration
      const loginResponse = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { access_token, user } = loginResponse.data;
      login(access_token, user);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
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
            <div className="bg-purple-600 rounded-2xl p-3 shrink-0 shadow-lg shadow-purple-600/20">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter italic">Join RateVoice</CardTitle>
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-1 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Node Registration Active</span>
              </div>
            </div>
          </div>
          <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mx-auto max-w-xs sm:max-w-sm leading-relaxed">
            Initialize your node in the global hospitality intelligence mesh.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="h-11 bg-[#0D0D0D] border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@example.com" 
                        {...field} 
                        className="h-11 bg-[#0D0D0D] border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-11 bg-[#0D0D0D] border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Key</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-11 bg-[#0D0D0D] border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                    </FormItem>
                  )}
                />
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                  Error: {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xl shadow-purple-600/20 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] mt-4" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering Node...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Create Node</span>
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
            Already have an identity?{' '}
            <Link href="/login" className="text-purple-500 hover:text-purple-400 transition-colors ml-1">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

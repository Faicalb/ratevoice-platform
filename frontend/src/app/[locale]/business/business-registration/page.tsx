'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { businessApi, BusinessRegistrationData } from '@/lib/api/business';
import { toast } from 'sonner';
import { MapPin, FileText, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const formSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  business_type: z.enum(['hotel', 'restaurant', 'cafe', 'other']),
  manager_name: z.string().min(2, "Manager name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Valid phone number required"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Address is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'rejected'>('idle');
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: BusinessRegistrationData = {
        ...data,
        business_license_upload: file || undefined,
      };
      
      await businessApi.register(payload);
      setVerificationStatus('pending');
      toast.success('Registration submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (verificationStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <CheckCircle2 className="h-24 w-24 text-primary relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight">Registration Submitted</h2>
          <p className="text-muted-foreground max-w-md">
            Our AI verification system is currently reviewing your documents. 
            This usually takes less than 24 hours. You will be notified via email.
          </p>
        </div>
        <Card className="w-full max-w-md bg-muted/30 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="font-bold uppercase text-xs tracking-widest text-primary">Status: In Review</p>
              <p className="text-xs text-muted-foreground">Analyzing business license & location data...</p>
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => setVerificationStatus('idle')}>
          Back to Form (Demo Only)
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          Business Registration
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Join the RateVoice network and start managing your reputation.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <Card className="border-border/50 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Establishment Details
            </CardTitle>
            <CardDescription className="text-xs">
              Please provide accurate information for verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Name</Label>
                  <Input id="business_name" {...register('business_name')} placeholder="e.g. Grand Hotel" />
                  {errors.business_name && <p className="text-xs text-destructive">{errors.business_name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
                  <Select onValueChange={(val) => setValue('business_type', val as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Cafe</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.business_type && <p className="text-xs text-destructive">{errors.business_type.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manager Name</Label>
                  <Input id="manager_name" {...register('manager_name')} placeholder="Full Name" />
                  {errors.manager_name && <p className="text-xs text-destructive">{errors.manager_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Email</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="contact@business.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                
                 <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                  <Input id="phone" {...register('phone')} placeholder="+1 234 567 890" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Country</Label>
                    <Input id="country" {...register('country')} placeholder="Country" />
                    {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</Label>
                    <Input id="city" {...register('city')} placeholder="City" />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Address</Label>
                  <Textarea id="address" {...register('address')} placeholder="Street address, building number..." className="resize-none" />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                 <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Documents
                </h3>
                
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 hover:bg-muted/20 transition-colors text-center cursor-pointer relative group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.png"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file ? file.name : "Upload Business License"}</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or Image (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-11 uppercase font-bold tracking-widest" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Why Register?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Get verified badge on RateVoice listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Access to advanced analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Manage customer bookings directly</span>
                </li>
                 <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span>Respond to voice reviews instantly</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                To prevent fraud, we require a valid government-issued business license or tax registration document.
              </p>
               <p className="text-xs text-muted-foreground leading-relaxed">
                Manual verification may be required if AI cannot automatically validate your documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { adminAmbassadorApi } from '@/lib/api/admin/ambassadors';
import { Plus, Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Phone is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
  level: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).default('BRONZE'),
  commissionRate: z.string().transform((val) => parseFloat(val)),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).default('ACTIVE'),
});

type FormValues = z.infer<typeof formSchema>;

export function AddAmbassadorModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: 'BRONZE',
      status: 'ACTIVE',
      commissionRate: 0.05
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await adminAmbassadorApi.createAmbassador(data);
      toast.success('Ambassador created successfully');
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error('Failed to create ambassador');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 text-xs uppercase font-bold tracking-widest gap-2">
          <Plus className="h-4 w-4" /> Add Ambassador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Ambassador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register('name')} placeholder="John Doe" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register('email')} placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register('phone')} placeholder="+1 234 567 890" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Commission Rate (0-1)</Label>
              <Input {...register('commissionRate')} placeholder="0.05" type="number" step="0.01" />
              {errors.commissionRate && <p className="text-xs text-red-500">{errors.commissionRate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input {...register('country')} placeholder="USA" />
              {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register('city')} placeholder="New York" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select onValueChange={(val: any) => setValue('level', val)} defaultValue="BRONZE">
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRONZE">Bronze</SelectItem>
                  <SelectItem value="SILVER">Silver</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="PLATINUM">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(val: any) => setValue('status', val)} defaultValue="ACTIVE">
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Ambassador
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

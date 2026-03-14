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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { adminAdsApi } from '@/lib/api/admin/ads';
import { Plus, Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  banner_image: z.string().url('Invalid URL').optional().or(z.literal('')),
  advertiser_id: z.string().min(1, 'Advertiser ID is required'),
  advertiser_type: z.enum(['BUSINESS', 'AMBASSADOR']),
  placement: z.string(),
  pricing_model: z.string(),
  total_budget: z.string().transform((val) => parseFloat(val)),
  target_country: z.string().optional(),
  target_city: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateAdModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      advertiser_type: 'BUSINESS',
      placement: 'HOME_FEED',
      pricing_model: 'CPM'
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await adminAdsApi.createAd(data);
      toast.success('Ad campaign created successfully');
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 text-xs uppercase font-bold tracking-widest gap-2">
          <Plus className="h-4 w-4" /> Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ad Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Title</Label>
              <Input {...register('title')} placeholder="Summer Sale" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Advertiser ID</Label>
              <Input {...register('advertiser_id')} placeholder="UUID" />
              {errors.advertiser_id && <p className="text-xs text-red-500">{errors.advertiser_id.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register('description')} placeholder="Ad copy..." />
          </div>

          <div className="space-y-2">
            <Label>Banner Image URL</Label>
            <Input {...register('banner_image')} placeholder="https://..." />
            {errors.banner_image && <p className="text-xs text-red-500">{errors.banner_image.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Advertiser Type</Label>
              <Select onValueChange={(val: any) => setValue('advertiser_type', val)} defaultValue="BUSINESS">
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="AMBASSADOR">Ambassador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select onValueChange={(val: any) => setValue('placement', val)} defaultValue="HOME_FEED">
                <SelectTrigger>
                  <SelectValue placeholder="Select Placement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME_FEED">Home Feed</SelectItem>
                  <SelectItem value="BUSINESS_PAGE">Business Page</SelectItem>
                  <SelectItem value="AMBASSADOR_PAGE">Ambassador Page</SelectItem>
                  <SelectItem value="SEARCH_RESULTS">Search Results</SelectItem>
                  <SelectItem value="BOOKING_PAGE">Booking Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select onValueChange={(val: any) => setValue('pricing_model', val)} defaultValue="CPM">
                <SelectTrigger>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPM">CPM (Cost per 1k views)</SelectItem>
                  <SelectItem value="CPC">CPC (Cost per click)</SelectItem>
                  <SelectItem value="TIME">Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Budget</Label>
              <Input {...register('total_budget')} type="number" placeholder="500.00" />
              {errors.total_budget && <p className="text-xs text-red-500">{errors.total_budget.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Country</Label>
              <Input {...register('target_country')} placeholder="USA" />
            </div>
            <div className="space-y-2">
              <Label>Target City</Label>
              <Input {...register('target_city')} placeholder="New York" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input {...register('start_date')} type="date" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input {...register('end_date')} type="date" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Campaign
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

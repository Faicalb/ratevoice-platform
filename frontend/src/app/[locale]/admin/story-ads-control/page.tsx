'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { adminStoriesApi } from '@/lib/api/admin/stories';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function StoryAdsPage() {
  const [ads, setAds] = useState<any[]>([]);

  const fetchAds = async () => {
    try {
      const data = await adminStoriesApi.getAllAds();
      setAds(data);
    } catch (error) {
      toast.error('Failed to load ads');
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Story Ads Control</h1>
      
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'business', header: 'Business', cell: (row: any) => row.story?.business?.name || 'Unknown' },
              { key: 'budget', header: 'Budget', cell: (row: any) => `$${row.budget}` },
              { key: 'spent', header: 'Spent', cell: (row: any) => `$${row.spent}` },
              { key: 'views', header: 'Views', cell: (row: any) => row.views },
              { key: 'clicks', header: 'Clicks', cell: (row: any) => row.clicks },
              { key: 'ctr', header: 'CTR', cell: (row: any) => `${(row.views > 0 ? (row.clicks / row.views) * 100 : 0).toFixed(2)}%` },
              { key: 'status', header: 'Status', cell: (row: any) => (
                <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge>
              )},
              { key: 'endAt', header: 'Ends', cell: (row: any) => new Date(row.endAt).toLocaleDateString() },
              { key: 'actions', header: '', cell: (row: any) => (
                <DropdownMenu>
                  <DropdownMenuTrigger><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Pause Campaign</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            ]}
            data={ads}
          />
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { adminStoriesApi } from '@/lib/api/admin/stories';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { MoreHorizontal, Play } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [previewStory, setPreviewStory] = useState<any>(null);

  const fetchStories = async () => {
    try {
      const data = await adminStoriesApi.getAllStories();
      setStories(data);
    } catch (error) {
      toast.error('Failed to load stories');
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      await adminStoriesApi.updateStatus(id, status);
      toast.success(`Story ${status}`);
      fetchStories();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Live Stories Moderation</h1>
      
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'preview', header: 'Preview', cell: (row: any) => (
                <div className="relative w-10 h-16 bg-black rounded cursor-pointer" onClick={() => setPreviewStory(row)}>
                  {row.type === 'IMAGE' ? (
                    <img src={row.mediaUrl} className="w-full h-full object-cover rounded" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-white"><Play className="h-4 w-4" /></div>
                  )}
                </div>
              )},
              { key: 'business', header: 'Business', cell: (row: any) => row.business?.name || 'Unknown' },
              { key: 'views', header: 'Views', cell: (row: any) => row.views },
              { key: 'reports', header: 'Reports', cell: (row: any) => row.reports },
              { key: 'aiScore', header: 'Risk Score', cell: (row: any) => (
                <Badge variant={row.aiScore > 80 ? 'destructive' : 'outline'}>{row.aiScore?.toFixed(0) || 0}</Badge>
              )},
              { key: 'status', header: 'Status', cell: (row: any) => (
                <Badge variant={row.status === 'active' ? 'default' : row.status === 'flagged' ? 'destructive' : 'secondary'}>
                  {row.status}
                </Badge>
              )},
              { key: 'actions', header: '', cell: (row: any) => (
                <DropdownMenu>
                  <DropdownMenuTrigger><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatus(row.id, 'active')}>Approve</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatus(row.id, 'flagged')}>Flag</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatus(row.id, 'removed')} className="text-red-500">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            ]}
            data={stories}
          />
        </CardContent>
      </Card>

      <Dialog open={!!previewStory} onOpenChange={() => setPreviewStory(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Story Preview</DialogTitle></DialogHeader>
          <div className="aspect-[9/16] bg-black">
            {previewStory?.type === 'IMAGE' ? (
              <img src={previewStory.mediaUrl} className="w-full h-full object-contain" />
            ) : (
              <video src={previewStory?.mediaUrl} className="w-full h-full" controls autoPlay />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

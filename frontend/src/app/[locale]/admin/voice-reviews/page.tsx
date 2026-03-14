'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { adminReviewsApi } from '@/lib/api/admin/reviews';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminVoiceReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const fetchReviews = async () => {
    try {
      const data = await adminReviewsApi.getAllVoiceReviews();
      setReviews(data);
    } catch (error) {
      toast.error('Failed to load voice reviews');
    }
  };

  useEffect(() => {
    fetchReviews();
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
  }, []);

  const handlePlay = (url: string, id: string) => {
    if (playingId === id) {
      audio?.pause();
      setPlayingId(null);
    } else {
      if (audio) audio.pause();
      const newAudio = new Audio(url);
      newAudio.play();
      newAudio.onended = () => setPlayingId(null);
      setAudio(newAudio);
      setPlayingId(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminReviewsApi.deleteVoiceReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Voice Reviews Moderation</h1>
      
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'user', header: 'User', cell: (row: any) => (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={row.user.avatarUrl} />
                    <AvatarFallback>{row.user.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-sm">{row.user.fullName}</div>
                    <div className="text-xs text-muted-foreground">{row.user.email}</div>
                  </div>
                </div>
              )},
              { key: 'rating', header: 'Rating', cell: (row: any) => row.rating },
              { key: 'transcript', header: 'Transcript', cell: (row: any) => (
                <div className="max-w-md truncate text-sm" title={row.transcript}>{row.transcript || 'Processing...'}</div>
              )},
              { key: 'audio', header: 'Audio', cell: (row: any) => (
                <Button size="sm" variant="outline" onClick={() => handlePlay(row.audioUrl, row.id)}>
                  {playingId === row.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )},
              { key: 'actions', header: 'Actions', cell: (row: any) => (
                <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            ]}
            data={reviews}
          />
        </CardContent>
      </Card>
    </div>
  );
}

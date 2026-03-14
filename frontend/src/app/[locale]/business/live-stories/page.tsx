'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storiesApi, Story } from '@/lib/api/stories';
import { toast } from 'sonner';
import { Plus, Trash2, Zap, Eye, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BusinessStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState<string | null>(null);
  const [formData, setFormData] = useState({ mediaUrl: '', type: 'IMAGE', duration: 15 });
  const [boostData, setBoostData] = useState({ budget: 50, duration: 7, targetCity: '', targetCountry: '' });

  const fetchStories = async () => {
    try {
      const data = await storiesApi.getMyStories();
      setStories(data);
    } catch (error) {
      toast.error('Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleCreate = async () => {
    try {
      await storiesApi.createStory(formData);
      toast.success('Story uploaded successfully');
      setCreateOpen(false);
      fetchStories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload story');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await storiesApi.deleteStory(id);
      toast.success('Story deleted');
      fetchStories();
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  const handleBoost = async () => {
    if (!boostOpen) return;
    try {
      await storiesApi.boostStory(boostOpen, boostData);
      toast.success('Story boosted successfully');
      setBoostOpen(null);
    } catch (error) {
      toast.error('Failed to boost story');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Live Stories</h1>
          <p className="text-muted-foreground">Share updates with your customers (Max 4)</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={stories.length >= 4}>
              <Plus className="mr-2 h-4 w-4" /> Upload Story
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Media URL</Label>
                <Input value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stories.map(story => (
          <Card key={story.id} className="overflow-hidden">
            <div className="aspect-[9/16] bg-black relative">
              {story.type === 'IMAGE' ? (
                <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
              ) : (
                <video src={story.mediaUrl} className="w-full h-full object-cover" controls />
              )}
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {new Date(story.expiresAt).toLocaleTimeString()}
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1"><Eye className="h-4 w-4" /> {story.views}</div>
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> 24h</div>
              </div>
              <div className="flex gap-2">
                <Dialog open={boostOpen === story.id} onOpenChange={(open) => setBoostOpen(open ? story.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1"><Zap className="mr-2 h-4 w-4" /> Boost</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Boost Story</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Budget ($)</Label>
                        <Input type="number" value={boostData.budget} onChange={e => setBoostData({...boostData, budget: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Target City</Label>
                        <Input value={boostData.targetCity} onChange={e => setBoostData({...boostData, targetCity: e.target.value})} />
                      </div>
                      <Button onClick={handleBoost} className="w-full">Launch Campaign</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(story.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

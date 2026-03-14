'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storiesApi, StoryAd } from '@/lib/api/stories';
import { RefreshCw, Video, Upload, Eye, MousePointer, Calendar, MoreHorizontal, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function StoriesVideoAdsPage() {
  const [stories, setStories] = useState<StoryAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const data = await storiesApi.getStories();
      setStories(data);
    } catch (error) {
      toast.error("Failed to load stories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Basic validation
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be under 50MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      toast.error("Please select a video and title");
      return;
    }

    setIsUploading(true);
    try {
      await storiesApi.uploadStory(file, title);
      toast.success("Story uploaded successfully!");
      setFile(null);
      setTitle('');
      fetchStories();
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Stories Video Ads</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Engage customers with short, vertical video stories.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchStories} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,2fr]">
        <Card className="border-border/50 shadow-lg h-fit">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <Video className="h-4 w-4 text-primary" />
                 Upload New Story
              </CardTitle>
              <CardDescription className="text-xs">
                 Video must be 10-30 seconds, vertical format (9:16).
              </CardDescription>
           </CardHeader>
           <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Story Title</Label>
                    <Input 
                        placeholder="e.g. Chef's Special" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                 </div>
                 
                 <div className="border-2 border-dashed border-border/50 rounded-lg p-8 hover:bg-muted/20 transition-colors text-center cursor-pointer relative group">
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleFileChange}
                        accept="video/mp4,video/quicktime"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{file ? file.name : "Drop video here or click to upload"}</p>
                            <p className="text-xs text-muted-foreground mt-1">MP4 or MOV (Max 50MB)</p>
                        </div>
                    </div>
                 </div>

                 <Button type="submit" disabled={isUploading || !file} className="w-full uppercase font-bold tracking-widest text-xs h-10">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isUploading ? 'Uploading...' : 'Publish Story'}
                 </Button>
              </form>
           </CardContent>
        </Card>

        <div className="space-y-6">
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                 <Card key={story.id} className="overflow-hidden border-border/50 shadow-lg group hover:border-primary/30 transition-all">
                    <div className="aspect-[9/16] relative bg-black">
                        {/* Thumbnail */}
                        <img 
                            src={story.thumbnail} 
                            alt={story.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                        />
                        
                        {/* Overlay Info */}
                        <div className="absolute inset-0 flex flex-col justify-between p-4">
                            <div className="flex justify-between items-start">
                                <Badge variant={
                                    story.status === 'active' ? 'default' :
                                    story.status === 'scheduled' ? 'secondary' : 'outline'
                                } className="uppercase text-[10px] tracking-widest backdrop-blur-md bg-opacity-80">
                                    {story.status}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="text-white font-bold text-sm drop-shadow-md">{story.title}</h3>
                                <p className="text-white/80 text-xs flex items-center gap-1 drop-shadow-md">
                                    <Video className="h-3 w-3" />
                                    {story.duration}s
                                </p>
                            </div>
                        </div>

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                <Play className="h-5 w-5 text-white ml-1" />
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" /> Views
                            </p>
                            <p className="font-mono text-sm">{story.views.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <MousePointer className="h-3 w-3" /> Clicks
                            </p>
                            <p className="font-mono text-sm">{story.clicks.toLocaleString()}</p>
                        </div>
                        {story.scheduledDate && (
                            <div className="col-span-2 pt-2 border-t border-border/50">
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(story.scheduledDate).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

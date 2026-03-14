'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { newsEngine, NewsEvent } from '@/lib/api/news-engine';
import { RefreshCw, Calendar, Megaphone, Plus, Clock, MapPin, Tag, Loader2, Globe, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NewsEventsPage() {
  const [items, setItems] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  
  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<NewsEvent>>({
    title: '',
    description: '',
    city: '',
    country: '',
    category: 'tourism_news',
    eventDate: '',
    isEvent: false,
    isNews: true
  });

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const data = await newsEngine.fetchLatest({
        city: cityFilter || undefined,
        country: countryFilter || undefined
      });
      setItems(data);
    } catch (error) {
      toast.error("Failed to load news & events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [cityFilter, countryFilter]);

  const handleTriggerEngine = async () => {
    setIsUpdatingEngine(true);
    try {
      const report = await newsEngine.triggerEngineUpdate();
      toast.success(`Engine Updated: Found ${report[0].newItems} new items`);
      fetchContent();
    } catch (error) {
      toast.error("Engine update failed");
    } finally {
      setIsUpdatingEngine(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsCreating(true);
    try {
      await newsEngine.create({
        ...formData,
        isEvent: formData.category !== 'tourism_news' && formData.category !== 'travel_alert',
        isNews: formData.category === 'tourism_news' || formData.category === 'travel_alert'
      });
      toast.success("Content published successfully");
      setFormData({
        title: '',
        description: '',
        city: '',
        country: '',
        category: 'tourism_news',
        eventDate: '',
        isEvent: false,
        isNews: true
      });
      fetchContent();
    } catch (error) {
      toast.error("Failed to create content");
    } finally {
      setIsCreating(false);
    }
  };

  const newsItems = items.filter(i => i.isNews);
  const eventItems = items.filter(i => i.isEvent);

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
          <h1 className="text-3xl font-black uppercase tracking-tight">News & Events Engine</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Automated tourism feeds and event management.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex gap-2">
             <Input 
               placeholder="Filter by City..." 
               className="h-9 w-32 text-xs" 
               value={cityFilter}
               onChange={e => setCityFilter(e.target.value)}
             />
             <Input 
               placeholder="Filter by Country..." 
               className="h-9 w-32 text-xs" 
               value={countryFilter}
               onChange={e => setCountryFilter(e.target.value)}
             />
           </div>
           <Button variant="outline" size="sm" onClick={handleTriggerEngine} disabled={isUpdatingEngine} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isUpdatingEngine ? 'animate-spin' : ''}`} /> 
            {isUpdatingEngine ? 'Updating...' : 'Force Update'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,2fr]">
        {/* Creator Panel */}
        <Card className="border-border/50 shadow-lg h-fit">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <Plus className="h-4 w-4 text-primary" />
                 Manual Publisher
              </CardTitle>
           </CardHeader>
           <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Title</Label>
                    <Input 
                        placeholder="e.g. Jazz Festival 2026" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Category</Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(val: any) => setFormData({...formData, category: val})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tourism_news">Tourism News</SelectItem>
                                <SelectItem value="travel_alert">Travel Alert</SelectItem>
                                <SelectItem value="festival">Festival</SelectItem>
                                <SelectItem value="concert">Concert</SelectItem>
                                <SelectItem value="hotel_opening">Hotel Opening</SelectItem>
                                <SelectItem value="restaurant_opening">Restaurant Opening</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Event Date</Label>
                        <Input 
                            type="datetime-local"
                            value={formData.eventDate}
                            onChange={e => setFormData({...formData, eventDate: e.target.value})}
                            disabled={formData.category === 'tourism_news' || formData.category === 'travel_alert'}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">City</Label>
                        <Input 
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Country</Label>
                        <Input 
                            value={formData.country}
                            onChange={e => setFormData({...formData, country: e.target.value})}
                        />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Description</Label>
                    <Textarea 
                        placeholder="Details..." 
                        className="resize-none h-24"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>

                 <Button type="submit" disabled={isCreating} className="w-full uppercase font-bold tracking-widest text-xs h-10">
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isCreating ? 'Publishing...' : 'Publish Content'}
                 </Button>
              </form>
           </CardContent>
        </Card>

        {/* Content Feed */}
        <div className="space-y-6">
           <Tabs defaultValue="all" className="w-full">
             <TabsList className="grid w-full grid-cols-3 mb-4">
               <TabsTrigger value="all">All Feeds</TabsTrigger>
               <TabsTrigger value="news">Latest News</TabsTrigger>
               <TabsTrigger value="events">Upcoming Events</TabsTrigger>
             </TabsList>

             <TabsContent value="all" className="space-y-4">
               {items.map(item => <NewsEventCard key={item.id} item={item} />)}
             </TabsContent>
             <TabsContent value="news" className="space-y-4">
               {newsItems.map(item => <NewsEventCard key={item.id} item={item} />)}
             </TabsContent>
             <TabsContent value="events" className="space-y-4">
               {eventItems.map(item => <NewsEventCard key={item.id} item={item} />)}
             </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}

function NewsEventCard({ item }: { item: NewsEvent }) {
  return (
    <Card className="border-border/50 shadow-sm hover:border-primary/30 transition-all overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {item.imageUrl && (
          <div className="w-full sm:w-32 h-32 bg-muted relative">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2">
              <Badge variant={item.isEvent ? "secondary" : "default"} className="uppercase text-[10px] tracking-widest">
                {item.isEvent ? 'Event' : 'News'}
              </Badge>
              <Badge variant="outline" className="uppercase text-[10px] tracking-widest">
                {item.category.replace('_', ' ')}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> {item.source}
            </span>
          </div>
          
          <h3 className="font-bold text-lg mb-1">{item.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.city}, {item.country}
            </div>
            {item.eventDate && (
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <Calendar className="h-3 w-3" />
                {new Date(item.eventDate).toLocaleDateString()}
              </div>
            )}
            {!item.eventDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

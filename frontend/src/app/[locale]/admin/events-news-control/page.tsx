'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { Newspaper, Calendar, Megaphone, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { getEvents, updateEventStatus, deleteEvent, EventNews } from '@/lib/api/admin/events';
import { toast } from 'sonner';

export default function EventsNewsControlPage() {
  const [items, setItems] = useState<EventNews[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await getEvents();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load events and news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, status: EventNews['status']) => {
    try {
      await updateEventStatus(id, status);
      setItems(items.map(i => i.id === id ? { ...i, status } : i));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setItems(items.filter(i => i.id !== id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cell: (row: EventNews) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: 'publisher',
      header: 'Publisher',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row: EventNews) => {
        const type = row.type;
        return (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row: EventNews) => {
        const status = row.status;
        return (
          <Badge variant={status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}>
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'views',
      header: 'Views',
      cell: (row: EventNews) => row.views.toLocaleString(),
    },
    {
      key: 'actions',
      header: '',
      cell: (row: EventNews) => {
        const item = row;
        return (
          <div className="flex items-center gap-2">
            {item.status === 'pending' && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleStatusChange(item.id, 'active')}
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleStatusChange(item.id, 'rejected')}
                  title="Reject"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(item.id)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        );
      },
    },
  ];

  const events = items.filter(i => i.type === 'event');
  const news = items.filter(i => i.type === 'news');
  const promotions = items.filter(i => i.type === 'promotion');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & News Control</h1>
          <p className="text-muted-foreground">Moderate and publish platform-wide news and events.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={async () => {
            try {
              const res = await fetch('/api/cron/news-update');
              const data = await res.json();
              if (data.success) {
                toast.success('News engine updated successfully');
              } else {
                toast.error('Update failed');
              }
            } catch (e) {
              toast.error('Network error');
            }
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Force Refresh News
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter(e => e.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Promotions</CardTitle>
            <Megaphone className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotions.filter(p => p.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">News Articles</CardTitle>
            <Newspaper className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{news.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Content</CardTitle>
              <CardDescription>Manage all events, news, and promotions.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading content...</div>
              ) : (
                // @ts-ignore - Ignoring DataTable type mismatch for quick fix
                <DataTable columns={columns} data={items} title="All Items" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>Items waiting for admin approval.</CardDescription>
            </CardHeader>
            <CardContent>
               {/* @ts-ignore */}
              <DataTable columns={columns} data={items.filter(i => i.status === 'pending')} title="Pending Review" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
               {/* @ts-ignore */}
              <DataTable columns={columns} data={events} title="Events" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions</CardTitle>
            </CardHeader>
            <CardContent>
               {/* @ts-ignore */}
              <DataTable columns={columns} data={promotions} title="Promotions" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

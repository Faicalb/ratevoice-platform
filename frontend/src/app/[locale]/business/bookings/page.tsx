'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookingsApi, Booking } from '@/lib/api/bookings';
import { RefreshCw, Calendar, Clock, Users, CreditCard, MoreHorizontal, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await bookingsApi.getBookings();
      setBookings(data);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    toast.promise(bookingsApi.updateStatus(id, newStatus), {
      loading: 'Updating status...',
      success: () => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        return `Booking ${newStatus}`;
      },
      error: 'Failed to update status'
    });
  };

  const filteredBookings = bookings.filter(b => 
    b.customerName.toLowerCase().includes(filter.toLowerCase()) || 
    b.id.toLowerCase().includes(filter.toLowerCase())
  );

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
          <h1 className="text-3xl font-black uppercase tracking-tight">Bookings</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage reservations and table assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchBookings} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
            + New Booking
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's Bookings</p>
                    <p className="text-2xl font-black">12</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-black text-amber-500">3</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Guests</p>
                    <p className="text-2xl font-black">48</p>
                </div>
                <Users className="h-8 w-8 text-blue-500/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Capacity</p>
                    <p className="text-2xl font-black text-emerald-500">85%</p>
                </div>
                <div className="h-8 w-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin-slow" />
            </CardContent>
         </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
            <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name or ID..." 
                    className="pl-9 h-10"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <Button variant="outline" size="sm" className="h-10 gap-2">
                <Filter className="h-4 w-4" />
                Filter
            </Button>
        </div>

        <DataTable 
            title="All Reservations"
            columns={[
                { key: 'id', header: 'ID', className: 'w-[100px]' },
                { key: 'customerName', header: 'Guest Name', cell: (row: any) => (
                    <div className="flex flex-col">
                        <span className="font-bold">{row.customerName}</span>
                        <span className="text-[10px] text-muted-foreground">{row.email}</span>
                    </div>
                )},
                { key: 'date', header: 'Date & Time', cell: (row: any) => (
                    <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(row.date).toLocaleDateString()}</span>
                        <Clock className="h-3 w-3 text-muted-foreground ml-2" />
                        <span>{row.time}</span>
                    </div>
                )},
                { key: 'guests', header: 'Guests', cell: (row: any) => (
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{row.guests}</span>
                    </div>
                )},
                { key: 'tableNumber', header: 'Table', cell: (row: any) => row.tableNumber ? `T-${row.tableNumber}` : '-' },
                { key: 'status', header: 'Status', cell: (row: any) => (
                    <Badge variant={
                        row.status === 'confirmed' ? 'default' : 
                        row.status === 'pending' ? 'secondary' : 'destructive'
                    } className="uppercase text-[10px] tracking-widest font-bold">
                        {row.status}
                    </Badge>
                )},
                { key: 'paymentStatus', header: 'Payment', cell: (row: any) => (
                    <div className="flex items-center gap-1 text-xs">
                        <CreditCard className={`h-3 w-3 ${row.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        <span className="capitalize">{row.paymentStatus}</span>
                    </div>
                )},
                { key: 'actions', header: 'Actions', className: 'text-right', cell: (row: any) => (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(row.id, 'confirmed')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Confirm
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(row.id, 'cancelled')}>
                                    <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Cancel
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )},
            ]}
            data={filteredBookings}
        />
      </div>
    </div>
  );
}

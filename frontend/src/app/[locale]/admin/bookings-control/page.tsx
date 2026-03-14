'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminBookingsApi, AdminBooking } from '@/lib/api/admin/bookings';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await adminBookingsApi.getAllBookings();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await adminBookingsApi.updateStatus(id, status);
      toast.success(`Booking ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm('Are you sure you want to refund this booking?')) return;
    try {
      await adminBookingsApi.refundBooking(id);
      toast.success('Booking refunded');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to refund booking');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Booking Control</h1>
        <Button onClick={fetchBookings} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            title="Bookings"
            description="System-wide booking monitoring."
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'user', header: 'User', cell: (row: AdminBooking) => (
                <div>
                  <div className="font-bold">{row.user.fullName}</div>
                  <div className="text-xs text-muted-foreground">{row.user.email}</div>
                </div>
              )},
              { key: 'branch', header: 'Business', cell: (row: AdminBooking) => row.branch.business.name },
              { key: 'totalAmount', header: 'Amount', cell: (row: AdminBooking) => `$${row.totalAmount}` },
              { key: 'status', header: 'Status', cell: (row: AdminBooking) => (
                <Badge variant={row.status === 'CONFIRMED' ? 'default' : row.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                  {row.status}
                </Badge>
              )},
              { key: 'actions', header: 'Actions', cell: (row: AdminBooking) => (
                <div className="flex gap-2">
                  {row.status !== 'CONFIRMED' && row.status !== 'CANCELLED' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(row.id, 'CONFIRMED')}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  {row.status !== 'CANCELLED' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(row.id, 'CANCELLED')}>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleRefund(row.id)}>
                    <RotateCcw className="h-4 w-4 text-blue-500" />
                  </Button>
                </div>
              )}
            ]}
            data={bookings}
          />
        </CardContent>
      </Card>
    </div>
  );
}

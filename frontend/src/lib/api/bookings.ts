export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  specialRequests?: string;
  tableNumber?: string;
}

import api from './api';

export const bookingsApi = {
  getBookings: async (): Promise<Booking[]> => {
    const res = await api.get('/bookings/business/my');
    return (res.data || []).map((b: any) => {
      const dt = new Date(b.bookingDate);
      const status = String(b.status || 'PENDING').toLowerCase();
      return {
        id: b.id,
        customerName: b.user?.fullName || '',
        email: b.user?.email || '',
        phone: b.user?.phoneNumber || '',
        date: dt.toISOString().slice(0, 10),
        time: dt.toISOString().slice(11, 16),
        guests: 0,
        status: status === 'confirmed' ? 'confirmed' : status === 'cancelled' ? 'cancelled' : 'pending',
        paymentStatus: 'paid'
      } as Booking;
    });
  },

  updateStatus: async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    const mapped = status === 'confirmed' ? 'CONFIRMED' : status === 'cancelled' ? 'CANCELLED' : 'PENDING';
    const res = await api.patch(`/bookings/${id}`, { status: mapped });
    return res.data;
  }
};

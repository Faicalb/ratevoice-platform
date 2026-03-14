import api from '../api';

export interface AdminBooking {
  id: string;
  userId: string;
  branchId: string;
  bookingDate: string;
  status: string;
  totalAmount: number;
  user: {
    fullName: string;
    email: string;
  };
  branch: {
    business: {
      name: string;
    };
  };
}

export const adminBookingsApi = {
  getAllBookings: async (): Promise<AdminBooking[]> => {
    const response = await api.get('/admin/bookings');
    return response.data;
  },

  getBookingById: async (id: string): Promise<AdminBooking> => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/admin/bookings/${id}/status`, { status });
    return response.data;
  },

  refundBooking: async (id: string) => {
    const response = await api.post(`/admin/bookings/${id}/refund`);
    return response.data;
  }
};

import api from './api';

export interface BusinessRegistrationData {
  business_name: string;
  business_type: 'hotel' | 'restaurant' | 'cafe' | 'other';
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  manager_name: string;
  business_license_upload?: File;
}

export const businessApi = {
  register: async (data: BusinessRegistrationData) => {
    // In a real app, handle file upload via FormData
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    
    // Simulate API call - Backend endpoint exists but might need verification logic
    // return new Promise((resolve) => setTimeout(() => resolve({ success: true, status: 'pending_verification' }), 1500));
    const response = await api.post('/business/register', formData);
    return response.data;
  },
  
  getVerificationStatus: async () => {
    // Simulate API call
    // return new Promise<{ status: 'pending' | 'verified' | 'rejected', details?: string }>((resolve) => 
    //   setTimeout(() => resolve({ status: 'pending', details: 'AI Verification in progress...' }), 1000)
    // );
    const response = await api.get('/business/verification-status');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/business/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/business/profile', data);
    return response.data;
  }
};

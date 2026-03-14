import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (!isFormData) {
    const headers = (config.headers || {}) as any;
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    config.headers = headers;
  }
  return config;
});

export default api;

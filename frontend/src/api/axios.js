import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach token from localStorage as a fallback to the httpOnly cookie
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    const status = error.response?.status;

    // Don't toast on 401 for the silent /auth/me check
    const isSilentAuthCheck = error.config?.url?.includes('/auth/me') && status === 401;
    if (!isSilentAuthCheck) {
      toast.error(message);
    }

    if (status === 401 && !isSilentAuthCheck) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export default api;

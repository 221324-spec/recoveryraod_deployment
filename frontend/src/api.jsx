import axios from 'axios';
import { getAxiosBaseURL } from './config/env';

// Create axios instance with base URL (same-origin /api or full URL when VITE_API_ORIGIN is set)
const api = axios.create({
  baseURL: getAxiosBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const url = String(config.url || '');
    const isPublicAuthRoute = /^\/auth\/(login|register|resend-verification|request-reset|reset-password|verify-otp)/.test(url);
    const token = localStorage.getItem('token');
    if (token && !isPublicAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear token and redirect to login if needed
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Authentication methods
api.login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const payload = response.data?.data || response.data;
  const { token, user } = payload || {};

  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  return response.data;
};

api.register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

api.verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

api.requestPasswordReset = async (email) => {
  const response = await api.post('/auth/request-reset', { email });
  return response.data;
};

api.resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export default api;

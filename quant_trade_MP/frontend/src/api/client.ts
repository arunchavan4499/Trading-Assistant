import axios from 'axios';

// Ensure base URL points to backend root; we'll append '/api' per endpoint definitions.
// If VITE_API_URL not set, default to 'http://127.0.0.1:8000'.
const RAW_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
// Strip trailing slash for consistency
const NORMALIZED = RAW_BASE.replace(/\/$/, '');
const API_BASE_URL = NORMALIZED + '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

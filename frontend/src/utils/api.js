import axios from 'axios';

// Get the appropriate API URL based on environment
const getApiUrl = () => {
  // If we have an environment variable, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're on a mobile device or different network
  const hostname = window.location.hostname;
  
  // If accessing from server IP, use server IP for API
  if (hostname === '10.0.0.96') {
    return 'http://10.0.0.96:5000/api';
  }
  
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      console.log('📡 Full URL:', config.baseURL + config.url);
      console.log('📋 Request data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ API Error:', error.response?.status, error.response?.statusText);
      console.log('❌ Error details:', error.response?.data);
      console.log('❌ Request URL:', error.config?.url);
    }
    
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

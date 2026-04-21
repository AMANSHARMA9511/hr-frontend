import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for better reliability
  withCredentials: true, // Important for CORS
});

// Request interceptor - Add token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log('Headers:', config.headers);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Network error - Backend is down
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - Backend might be slow or down');
      error.message = 'Server is taking too long to respond. Please try again.';
    } else if (!error.response) {
      console.error('🌐 Network Error - Backend is not reachable');
      error.message = 'Cannot connect to server. Please check if backend is running.';
    } else {
      // Handle specific HTTP status codes
      switch (error.response?.status) {
        case 400:
          console.error('❌ Bad Request:', error.response?.data?.message);
          error.message = error.response?.data?.message || 'Invalid request. Please check your input.';
          break;
          
        case 401:
          console.error('🔒 Unauthorized - Token expired or invalid');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          error.message = 'Session expired. Please login again.';
          break;
          
        case 403:
          console.error('🚫 Forbidden - Insufficient permissions');
          error.message = error.response?.data?.message || 'You do not have permission to perform this action.';
          break;
          
        case 404:
          console.error('🔍 Not Found:', error.config?.url);
          error.message = 'API endpoint not found. Please check the URL.';
          break;
          
        case 500:
          console.error('💥 Server Error:', error.response?.data?.message);
          error.message = 'Server error. Please try again later.';
          break;
          
        default:
          console.error(`❌ Error ${error.response?.status}:`, error.response?.data?.message);
          error.message = error.response?.data?.message || 'An unexpected error occurred.';
      }
    }
    
    // Show error toast if available
    if (typeof toast !== 'undefined') {
      toast.error(error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to test backend connection
export const testBackendConnection = async () => {
  try {
    const response = await apiClient.get('/health');
    console.log('✅ Backend is reachable:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Helper function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export default apiClient;
import apiClient from './apiClient';

const AUTH_URL = '/auth';

const authService = {
  // User registration
  register: async (userData) => {
    try {
      const response = await apiClient.post(`${AUTH_URL}/register`, {
        name: userData.fullName || userData.name,
        email: userData.email,
        password: userData.password
      });
      
      // Don't auto-login after registration
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // User login
  login: async (email, password) => {
    try {
      const response = await apiClient.post(`${AUTH_URL}/login`, {
        email,
        password
      });
      
      // Store token and user data
      if (response.data.token) {
        const normalizedUser = {
          ...response.data.user,
          fullName: response.data.user?.fullName || response.data.user?.name
        };
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get(`${AUTH_URL}/profile`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(`${AUTH_URL}/profile`, profileData);
      
      // Update stored user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        ...response.data,
        fullName: response.data.fullName || response.data.name || currentUser.fullName
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Get user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.getUserRole() === 'admin';
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.post(`${AUTH_URL}/change-password`, {
        oldPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  }
};

export default authService;
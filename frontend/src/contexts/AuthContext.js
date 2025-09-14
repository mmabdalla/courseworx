import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const checkSetupAndAuth = useCallback(async () => {
    try {
      // First check if setup is required
      const setupResponse = await authAPI.setupStatus();
      const { setupRequired: needsSetup } = setupResponse.data;
      
      if (needsSetup) {
        setSetupRequired(true);
        setLoading(false);
        return;
      }

      // If setup is not required, check authentication
      await checkAuth();
    } catch (error) {
      console.error('Setup and auth check failed:', error);
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getCurrentUser();
        if (response.data && response.data.user) {
          setUser(response.data.user);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSetupAndAuth();
  }, [checkSetupAndAuth]);

  const login = async (identifier, password) => {
    try {
      console.log('🔐 AuthContext: Login attempt started');
      console.log('📧 Identifier:', identifier);
      console.log('🔑 Password length:', password.length);
      console.log('🌐 Current location:', window.location.href);
      
      console.log('📡 Calling authAPI.login...');
      const response = await authAPI.login(identifier, password);
      console.log('📡 authAPI.login response:', response);
      
      const { token, user } = response.data;
      console.log('🔑 Token received:', token ? 'Yes' : 'No');
      console.log('👤 User data received:', user);
      
      localStorage.setItem('token', token);
      console.log('💾 Token saved to localStorage');
      
      // Set user state after a brief delay to prevent immediate redirect
      setTimeout(() => {
        console.log('👤 Setting user state...');
        setUser(user);
      }, 50);
      
      toast.success('Login successful!');
      console.log('✅ Login completed successfully');
      return { success: true };
    } catch (error) {
      console.error('💥 AuthContext: Login error occurred');
      console.error('💥 Error object:', error);
      console.error('💥 Error response:', error.response);
      console.error('💥 Error response data:', error.response?.data);
      console.error('💥 Error response status:', error.response?.status);
      console.error('💥 Error message:', error.message);
      
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateUser = (userData) => {
    console.log('updateUser called with:', userData);
    setUser(userData);
    // If we have a user, setup is no longer required
    if (userData) {
      console.log('Setting setupRequired to false');
      setSetupRequired(false);
    }
  };

  const value = {
    user,
    loading,
    setupRequired,
    login,
    logout,
    updateProfile,
    changePassword,
    updateUser,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isTrainer: user?.role === 'trainer',
    isTrainee: user?.role === 'trainee',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
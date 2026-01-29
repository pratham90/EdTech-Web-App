import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('edtech_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Verify token is still valid
          try {
            const response = await api.checkAuth();
            setUser({ ...userData, ...response });
          } catch (error) {
            // Token invalid, clear storage
            localStorage.removeItem('edtech_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      if (!response || !response._id) {
        throw new Error('Invalid response from server');
      }
      const userData = {
        _id: response._id,
        email: response.email,
        role: response.role,
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email.split('@')[0]}`
      };
      setUser(userData);
      localStorage.setItem('edtech_user', JSON.stringify(userData));
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      // Preserve the original error message which now includes helpful backend connection info
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, role) => {
    setLoading(true);
    try {
      const response = await api.signup(role, email, password);
      if (!response) {
        throw new Error('Invalid response from server');
      }
      const userData = {
        _id: response._id,
        email: response.email || email,
        name,
        role: response.role || role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      };
      setUser(userData);
      localStorage.setItem('edtech_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('edtech_user');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

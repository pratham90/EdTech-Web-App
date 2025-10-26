import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const storedUser = localStorage.getItem('edtech_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      // Mock authentication - replace with real API call in production
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser = {
        id: `${role}_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email.split('@')[0]}`
      };

      setUser(mockUser);
      localStorage.setItem('edtech_user', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, role) => {
    setLoading(true);
    try {
      // Mock signup - replace with real API call in production
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser = {
        id: `${role}_${Date.now()}`,
        email,
        name,
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      };

      setUser(mockUser);
      localStorage.setItem('edtech_user', JSON.stringify(mockUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edtech_user');
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

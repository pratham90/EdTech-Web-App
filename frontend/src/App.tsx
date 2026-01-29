import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './features/auth';
import { Layout } from './shared/components/layout';
import { Toaster } from './shared/components/ui/sonner';
import api from './services/api';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Test backend connection on app load (silently, don't show errors to user)
    api.testConnection().then(isConnected => {
      if (isConnected) {
        console.log('✅ Backend is reachable and ready!');
      } else {
        console.warn('⚠️ Backend connection test failed. Some features may not work.');
        console.warn('💡 If you just updated CORS settings, please restart your backend server.');
      }
    }).catch(() => {
      // Silently handle connection test failures on app load
      // Errors will be shown when user actually tries to use features
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Layout /> : <AuthForm />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

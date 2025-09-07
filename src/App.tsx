import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/layout/Layout';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

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
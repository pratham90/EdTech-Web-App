import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from './Header';
import { StudentDashboard } from '../dashboard/StudentDashboard';
import { TeacherDashboard } from '../dashboard/TeacherDashboard';

export function Layout() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {user.role === 'student' ? <StudentDashboard /> : <TeacherDashboard />}
      </main>
    </div>
  );
}

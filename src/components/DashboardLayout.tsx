import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { NotificationBell } from './NotificationBell';

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto relative">
        {/* Notification Bell - Fixed position in header area */}
        <div className="fixed top-4 right-6 z-50">
          <NotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

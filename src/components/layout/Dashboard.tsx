
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const Dashboard = ({ children, title, subtitle }: DashboardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Log the dashboard render state for debugging
  useEffect(() => {
    console.log(`Dashboard rendering - Path: ${location.pathname}, User: ${user?.id || 'none'}, Loading: ${isLoading}`);
  }, [user, isLoading, location.pathname]);
  
  // If still loading, show the loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
      </div>
    );
  }
  
  // This is a fallback - ProtectedRoute should handle this case
  // Do not add redirect logic here, since it's already in ProtectedRoute
  if (!user) {
    // Just render a loading state, since ProtectedRoute will handle the redirect
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <Header title={title} subtitle={subtitle} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

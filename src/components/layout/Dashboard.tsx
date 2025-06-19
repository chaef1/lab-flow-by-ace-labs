
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
  showSearch?: boolean;
}

const Dashboard = ({ children, title, subtitle, showSearch = false }: DashboardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log(`Dashboard rendering - Path: ${location.pathname}, User: ${user?.id || 'none'}, Loading: ${isLoading}`);
  }, [user, isLoading, location.pathname]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-300/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-300/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background w-full">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <Header title={title} subtitle={subtitle} showSearch={showSearch} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-4 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

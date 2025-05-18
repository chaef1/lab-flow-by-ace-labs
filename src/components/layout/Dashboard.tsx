
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const Dashboard = ({ children, title, subtitle }: DashboardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Simple auth check
  useEffect(() => {
    const user = localStorage.getItem('agencyDashboardUser');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

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

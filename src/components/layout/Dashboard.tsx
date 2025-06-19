
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
}

const Dashboard = ({ children, title, subtitle, showSearch = false }: DashboardProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64 transition-all duration-300">
        <Header title={title} subtitle={subtitle} showSearch={showSearch} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-4 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

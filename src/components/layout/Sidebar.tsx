
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Users,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type SidebarProps = {
  className?: string;
};

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('agencyDashboardUser') || '{"role": "admin"}');
  const isAdmin = userInfo.role === 'admin';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FileText },
    { name: 'Content Approval', path: '/content', icon: FileText },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    // Only show Users page to admins
    ...(isAdmin ? [{ name: 'Users', path: '/users', icon: Users }] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('agencyDashboardUser');
    window.location.href = '/';
  };

  // Check if the path matches the current location
  const isActive = (path: string) => location.pathname === path;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-agency-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-lg text-agency-800">Agency</span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <X size={20} />
          </Button>
        )}
      </div>
      
      <div className="mt-8 space-y-1 px-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start font-medium",
                isActive(item.path) ? "bg-agency-100 text-agency-800" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive(item.path) ? "text-agency-600" : "")} />
              {item.name}
            </Button>
          </Link>
        ))}
      </div>
      
      <div className="mt-auto pt-4 px-2">
        <Button
          variant="ghost"
          className="w-full justify-start font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {isMobile && (
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </Button>
      )}
      
      <div 
        className={cn(
          "fixed inset-0 z-30 bg-black/50 md:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggleSidebar}
      />

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-border bg-sidebar flex flex-col transition-transform",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0",
          !isMobile && "translate-x-0",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

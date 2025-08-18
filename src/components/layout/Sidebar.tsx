import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Menu,
  X,
  LogOut,
  ChartBar,
  UserCircle,
  Search,
  Users2
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

type SidebarProps = {
  className?: string;
};

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { userProfile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isAdmin = userProfile?.role === 'admin';
  const isCreator = userProfile?.role === 'creator';
  const isBrand = userProfile?.role === 'brand';
  const isAgency = userProfile?.role === 'agency';
  const isInfluencer = userProfile?.role === 'influencer';

  // Define menu items based on user role
  const menuItems = [
    // Everyone sees Dashboard
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'creator', 'brand', 'agency', 'influencer'] },
    
    // Profile - all users
    { name: 'My Profile', path: '/profile', icon: UserCircle, roles: ['admin', 'creator', 'brand', 'agency', 'influencer'] },
    
    // MODASH FEATURES
    { name: 'Discovery', path: '/discover', icon: Search, roles: ['admin', 'brand', 'agency'] },
    { name: 'Creator Lists', path: '/creator-lists', icon: Users2, roles: ['admin', 'brand', 'agency'] },
    
    // Reporting - admins, agencies, and brands
    { name: 'Reporting', path: '/reporting', icon: ChartBar, roles: ['admin', 'brand', 'agency'] },
    
    // Wallet - all users
    { name: 'Wallet', path: '/wallet', icon: Wallet, roles: ['admin', 'creator', 'brand', 'agency', 'influencer'] },
    
    // Users - admin and agency only
    { name: 'Users', path: '/users', icon: Users, roles: ['admin', 'agency'] },
  ].filter(item => {
    // Filter items based on user role
    if (!userProfile) return false;
    return item.roles.includes(userProfile.role);
  });

  const handleLogout = () => {
    signOut();
  };

  // Check if the path matches the current location
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-ace-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-lg text-ace-dark">Ace Labs</span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <X size={20} />
          </Button>
        )}
      </div>
      
      <div className="mt-4 px-2 py-2">
        {userProfile && (
          <div className="px-2 py-2 mb-4">
            <div className="text-xs uppercase text-muted-foreground">Logged in as</div>
            <div className="font-medium mt-1">{userProfile.role}</div>
          </div>
        )}
      </div>
      
      <div className="mt-2 space-y-1 px-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start font-medium transition-all duration-200",
                isActive(item.path) 
                  ? "bg-primary/10 text-primary border-l-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive(item.path) ? "text-primary" : "")} />
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

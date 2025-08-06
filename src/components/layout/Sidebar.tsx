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
  LogOut,
  ChartBar,
  MessageSquare,
  Star,
  UserCircle,
  BarChart3,
  Mail
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
    
    // Projects menu - admins, creators, agencies, and brands
    { name: 'Projects', path: '/projects', icon: FileText, roles: ['admin', 'creator', 'brand', 'agency'] },
    
    // Content Approval - admins, creators, agencies, and brands
    { name: 'Content Approval', path: '/content', icon: FileText, roles: ['admin', 'creator', 'brand', 'agency'] },
    
    // Content Scheduler - admins, creators, agencies, and brands
    { name: 'Content Scheduler', path: '/content-scheduler', icon: MessageSquare, roles: ['admin', 'creator', 'brand', 'agency'] },
    
    // Influencers directory - admins, agencies, and brands
    { name: 'Influencers', path: '/influencers', icon: Star, roles: ['admin', 'brand', 'agency'] },
    
    // Advertising - admins, agencies, and brands
    { name: 'Advertising', path: '/advertising', icon: BarChart3, roles: ['admin', 'brand', 'agency'] },
    
    // Campaigns - influencers only
    { name: 'My Campaigns', path: '/campaigns', icon: FileText, roles: ['influencer'] },
    
    // Content submission - influencers only
    { name: 'Submit Content', path: '/submit-content', icon: MessageSquare, roles: ['influencer'] },
    
    // Reporting - admins, agencies, and brands
    { name: 'Reporting', path: '/reporting', icon: ChartBar, roles: ['admin', 'brand', 'agency'] },
    
    // Wallet - all users
    { name: 'Wallet', path: '/wallet', icon: Wallet, roles: ['admin', 'creator', 'brand', 'agency', 'influencer'] },
    
    // Users - admin and agency only
    { name: 'Users', path: '/users', icon: Users, roles: ['admin', 'agency'] },
    
    // Mailchimp - admin only
    { name: 'Mailchimp', path: '/mailchimp', icon: Mail, roles: ['admin'] },
  ].filter(item => {
    // Filter items based on user role
    if (!userProfile) return false;
    return item.roles.includes(userProfile.role);
  });

  const handleLogout = () => {
    signOut();
  };

  // Check if the path matches the current location
  const isActive = (path: string) => location.pathname === path;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-lg text-foreground">Ace Labs</span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <X size={20} />
          </Button>
        )}
      </div>
      
      <div className="mt-6 px-4">
        {userProfile && (
          <div className="modern-card p-3 mb-4">
            <div className="text-xs uppercase text-muted-foreground font-medium tracking-wide">Logged in as</div>
            <div className="font-semibold mt-1 text-foreground capitalize">{userProfile.role}</div>
          </div>
        )}
      </div>
      
      <div className="mt-2 space-y-2 px-4">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium touch-target transition-all duration-200",
                isActive(item.path) 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive(item.path) ? "text-primary" : "")} />
              {item.name}
            </Button>
          </Link>
        ))}
      </div>
      
      <div className="mt-auto pt-6 px-4">
        <Button
          variant="ghost"
          className="w-full justify-start font-medium text-destructive hover:bg-destructive/10 hover:text-destructive touch-target transition-all duration-200"
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
          "fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-border bg-sidebar flex flex-col transition-all duration-300 ease-in-out",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0 shadow-2xl",
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

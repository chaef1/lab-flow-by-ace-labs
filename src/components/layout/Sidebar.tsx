import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  BarChart3,
  Megaphone,
  Wallet,
  Settings,
  User,
  Target,
  Upload,
  Calculator
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItemProps {
  name: string;
  href: string;
  icon: any;
  permission: string;
}

const Sidebar = () => {
  const { userProfile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'Projects', href: '/projects', icon: Briefcase, permission: 'projects' },
    { name: 'Content', href: '/content', icon: FileText, permission: 'content' },
    { name: 'Influencers', href: '/influencers', icon: Users, permission: 'influencers' },
    { name: 'Campaigns', href: '/campaigns', icon: Target, permission: 'campaigns' },
    { name: 'Submit Content', href: '/submit-content', icon: Upload, permission: 'submit_content' },
    { name: 'Reporting', href: '/reporting', icon: BarChart3, permission: 'reporting' },
    { name: 'Advertising', href: '/advertising', icon: Megaphone, permission: 'advertising' },
    { name: 'Budget Estimator', href: '/budget-estimator', icon: Calculator, permission: 'projects' },
    { name: 'Wallet', href: '/wallet', icon: Wallet, permission: 'wallet' },
    { name: 'User Management', href: '/user-management', icon: Settings, permission: 'user_management' },
  ];

  const hasPermission = (permission: string) => {
    if (!userProfile || !userProfile.permissions) return false;
    return userProfile.permissions.includes(permission);
  };

  const filteredNavigation = navigationItems.filter(item => hasPermission(item.permission));

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col top-0 left-0 w-64 bg-secondary border-r border-r-muted h-full transition-all duration-300",
        collapsed ? "-ml-64" : "ml-0",
        isMobile ? "-ml-64" : "ml-0"
      )}
    >
      <div className="shrink-0 flex items-center justify-between h-16 px-4 border-b border-b-muted">
        <Link to="/dashboard" className="font-bold text-lg">
          ACE Agency
        </Link>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <nav className="flex flex-col space-y-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-t-muted p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback>{userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <span>{userProfile?.first_name} {userProfile?.last_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;

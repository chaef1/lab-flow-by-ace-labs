
import React, { useState } from "react";
import UserMenu from "../auth/UserMenu";
import { Button } from "../ui/button";
import { Menu, Bell, Search as SearchIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
}

const Header = ({ title, subtitle, showSearch = false }: HeaderProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const { userProfile } = useAuth();
  
  return (
    <header className="border-b bg-background/80 backdrop-blur-md p-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div>
            {title && <h1 className="text-xl font-bold tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {showSearch && (
            <div className={cn(
              "transition-all duration-200 overflow-hidden", 
              searchActive ? "w-full md:w-72" : "w-10"
            )}>
              <div className="flex items-center bg-secondary/50 rounded-full h-10 px-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full p-0 mr-1"
                  onClick={() => setSearchActive(!searchActive)}
                >
                  <SearchIcon className="h-4 w-4" />
                </Button>
                {searchActive && (
                  <Input 
                    placeholder="Search..." 
                    className="border-0 bg-transparent h-8 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-0" 
                    autoFocus
                    onBlur={() => setSearchActive(false)}
                  />
                )}
              </div>
            </div>
          )}
          
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              3
            </Badge>
          </Button>
          
          {userProfile && (
            <div className="hidden md:flex items-center gap-2">
              <Badge variant={
                userProfile.role === 'admin' ? 'default' : 
                userProfile.role === 'brand' ? 'secondary' : 
                userProfile.role === 'influencer' ? 'outline' : 'default'
              }>
                {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
              </Badge>
            </div>
          )}
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;

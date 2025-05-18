
import React, { useState } from "react";
import UserMenu from "../auth/UserMenu";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
}

const Header = ({ title, subtitle, showSearch = false }: HeaderProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add state for search functionality if needed
  
  return (
    <header className="border-b bg-background p-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <div>
            {title && <h1 className="text-xl font-bold">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Right-aligned items can go here */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;

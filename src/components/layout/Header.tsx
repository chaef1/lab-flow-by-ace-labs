
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('agencyDashboardUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('agencyDashboardUser');
    window.location.href = '/';
  };

  // Placeholder notifications
  const notifications = [
    { id: 1, message: 'New project comment from John', read: false },
    { id: 2, message: 'Payment received for Project X', read: true },
    { id: 3, message: 'Content ready for review', read: false }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="flex justify-between items-center px-4 py-2 md:py-3 md:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="py-3 cursor-pointer">
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <div className="h-2 w-2 mt-1.5 rounded-full bg-agency-500 flex-shrink-0" />
                    )}
                    <span className={notification.read ? "text-muted-foreground" : ""}>
                      {notification.message}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center font-medium text-agency-600">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name || 'User'}</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
              {user?.email || 'user@example.com'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;

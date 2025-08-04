

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Link, Instagram, Youtube, Linkedin, Twitter, Facebook } from "lucide-react";

export type Platform = 'instagram' | 'tiktok' | 'facebook';

interface SearchFormProps {
  platform: Platform;
  username: string;
  isLoading: boolean;
  onUsernameChange: (username: string) => void;
  onSearch: () => void;
}

export function SearchForm({ 
  platform, 
  username, 
  isLoading, 
  onUsernameChange, 
  onSearch 
}: SearchFormProps) {
  const getPlatformIcon = () => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4 mr-2 text-purple-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 mr-2 text-blue-500" />;
      case 'tiktok': return <div className="h-4 w-4 mr-2 text-black font-bold text-xs flex items-center justify-center">♪</div>;
      default: return <Link className="h-4 w-4 mr-2" />;
    }
  };

  const getPlatformGradient = () => {
    switch (platform) {
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'facebook': return 'from-blue-500 to-blue-600';
      case 'tiktok': return 'from-black to-gray-800';
      default: return 'from-primary to-secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-3 sm:p-4 rounded-lg bg-gradient-to-r ${getPlatformGradient()} text-white`}>
        <div className="flex items-center font-medium text-sm sm:text-base">
          {getPlatformIcon()}
          Search {platform.charAt(0).toUpperCase() + platform.slice(1)} Profiles
        </div>
        <p className="text-white/80 text-xs sm:text-sm mt-1">
          Enter a username or profile URL
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            placeholder={`@username or ${platform}.com/username`}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button 
          onClick={onSearch} 
          disabled={isLoading}
          size="lg"
          className={`bg-gradient-to-r ${getPlatformGradient()} hover:opacity-90 text-white px-6 sm:px-8 w-full sm:w-auto h-10 sm:h-12`}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <span className="text-sm sm:text-base">Search</span>
        </Button>
      </div>
    </div>
  );
}

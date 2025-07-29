

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Link, Instagram, Youtube, Linkedin, Twitter, Facebook } from "lucide-react";

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';

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
      case 'youtube': return <Youtube className="h-4 w-4 mr-2 text-red-500" />;
      case 'linkedin': return <Linkedin className="h-4 w-4 mr-2 text-blue-600" />;
      case 'twitter': return <Twitter className="h-4 w-4 mr-2 text-sky-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 mr-2 text-blue-500" />;
      case 'tiktok': return <div className="h-4 w-4 mr-2 text-black font-bold text-xs flex items-center justify-center">♪</div>;
      default: return <Link className="h-4 w-4 mr-2" />;
    }
  };

  const getPlatformGradient = () => {
    switch (platform) {
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'youtube': return 'from-red-500 to-red-600';
      case 'linkedin': return 'from-blue-600 to-blue-700';
      case 'twitter': return 'from-sky-400 to-blue-500';
      case 'facebook': return 'from-blue-500 to-blue-600';
      case 'tiktok': return 'from-black to-gray-800';
      default: return 'from-primary to-secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg bg-gradient-to-r ${getPlatformGradient()} text-white`}>
        <div className="flex items-center font-medium">
          {getPlatformIcon()}
          Search {platform.charAt(0).toUpperCase() + platform.slice(1)} Profiles
        </div>
        <p className="text-white/80 text-sm mt-1">
          Enter a username, handle, or full profile URL to find influencer profiles
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={`Enter @username or full ${platform} profile URL`}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="pl-12 h-12 text-base border-2 focus:border-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button 
          onClick={onSearch} 
          disabled={isLoading}
          size="lg"
          className={`bg-gradient-to-r ${getPlatformGradient()} hover:opacity-90 text-white px-6 sm:px-8 w-full sm:w-auto`}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Search className="mr-2 h-5 w-5" />
          )}
          Search
        </Button>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-3 text-sm">
        <div className="flex items-center text-muted-foreground mb-2">
          <Link className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="font-medium">Supported formats:</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="break-all">• Username: <code className="bg-muted px-1 rounded">@{platform === 'tiktok' ? 'username' : 'username'}</code></p>
          <p className="break-all">• Profile URL: <code className="bg-muted px-1 rounded">https://www.{platform}.com/{platform === 'linkedin' ? 'in/' : ''}username</code></p>
        </div>
      </div>
    </div>
  );
}

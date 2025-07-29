
import { Button } from "@/components/ui/button";
import { History, Loader2, Clock, Instagram, Youtube, Linkedin, Twitter, Facebook } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { Platform } from "./SearchForm";

interface SearchHistoryProps {
  searchHistory: Array<{
    id: string;
    username: string;
    platform: string;
    timestamp: string;
  }>;
  isHistoryLoading: boolean;
  onClearHistory: () => void;
  onHistoryItemClick: (platform: Platform, username: string) => void;
}

export function SearchHistory({ 
  searchHistory, 
  isHistoryLoading, 
  onClearHistory, 
  onHistoryItemClick 
}: SearchHistoryProps) {
  // Helper function to render platform-specific icon
  const PlatformIcon = ({platform}: {platform: string}) => {
    switch (platform) {
      case 'instagram': 
        return <Instagram className="h-4 w-4 text-purple-500" />;
      case 'youtube': 
        return <Youtube className="h-4 w-4 text-red-500" />;
      case 'linkedin': 
        return <Linkedin className="h-4 w-4 text-blue-600" />;
      case 'twitter': 
        return <Twitter className="h-4 w-4 text-sky-500" />;
      case 'facebook': 
        return <Facebook className="h-4 w-4 text-blue-500" />;
      case 'tiktok': 
        return <div className="h-4 w-4 text-black font-bold text-xs flex items-center justify-center">♪</div>;
      default: 
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <div>
          <h3 className="font-semibold text-lg">Recent Searches</h3>
          <p className="text-sm text-muted-foreground">Your last 10 profile searches</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearHistory}
          disabled={searchHistory.length === 0 || isHistoryLoading}
          className="bg-white hover:bg-muted"
        >
          Clear History
        </Button>
      </div>
      
      {isHistoryLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : searchHistory.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-medium text-lg mb-2">No recent searches</h4>
          <p className="text-muted-foreground">Start searching for influencers to see your history here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {searchHistory.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-primary/20 bg-gradient-to-r from-background to-muted/30 hover:from-primary/5 hover:to-secondary/5 cursor-pointer transition-all duration-200 hover:shadow-md"
              onClick={() => onHistoryItemClick(item.platform as Platform, item.username)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted/50">
                  <PlatformIcon platform={item.platform} />
                </div>
                <div>
                  <span className="font-semibold text-base">@{item.username}</span>
                  <p className="text-sm text-muted-foreground capitalize">{item.platform}</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                <Clock className="h-3 w-3 mr-2" />
                {formatRelativeDate(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-muted/20 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Search history is automatically cleared after 24 hours
        </p>
      </div>
    </div>
  );
}

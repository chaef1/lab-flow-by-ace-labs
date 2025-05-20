
import { Button } from "@/components/ui/button";
import { History, Loader2, Clock } from "lucide-react";
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
    if (platform === 'instagram') {
      return <Instagram className="mr-2 h-4 w-4" />;
    } else if (platform === 'tiktok') {
      // Using a custom TikTok icon as SVG
      return (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="currentColor" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Recent Searches</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearHistory}
          disabled={searchHistory.length === 0 || isHistoryLoading}
        >
          Clear History
        </Button>
      </div>
      
      {isHistoryLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : searchHistory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No recent searches</p>
        </div>
      ) : (
        <div className="space-y-2">
          {searchHistory.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onHistoryItemClick(item.platform as Platform, item.username)}
            >
              <div className="flex items-center gap-3">
                <PlatformIcon platform={item.platform} />
                <span className="font-medium">@{item.username}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatRelativeDate(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-2">
        <p>Search history is automatically cleared after 24 hours</p>
      </div>
    </div>
  );
}

// Fix the import for Instagram icon
import { Instagram } from "lucide-react";

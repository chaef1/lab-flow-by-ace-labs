import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Users, 
  Eye, 
  ExternalLink, 
  BookmarkPlus,
  MoreVertical,
  MapPin,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SaveToListDialog } from './SaveToListDialog';
import { CreatorAnalyticsPanel } from './CreatorAnalyticsPanel';
import { useNavigate } from 'react-router-dom';

interface CreatorCardProps {
  creator: {
    userId: string;
    username: string;
    fullName: string;
    profilePicUrl: string;
    followers: number;
    engagementRate: number;
    avgLikes: number;
    avgViews: number;
    isVerified: boolean;
    hasContactDetails: boolean;
    topAudience?: {
      country: string;
      city: string;
    };
    platform: string;
  };
  platform: string;
}

export const CreatorCard = ({ creator, platform }: CreatorCardProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const navigate = useNavigate();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleViewProfile = () => {
    navigate(`/creators/${platform}/${creator.userId}`);
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all cursor-pointer">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
                <AvatarFallback>{creator.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold truncate">{creator.fullName || creator.username}</h3>
                  {creator.isVerified && (
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
                {creator.topAudience?.country && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{creator.topAudience.country}</span>
                  </div>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewProfile}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAnalyticsOpen(true)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Live Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Save to List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(creator.followers)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Heart className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{(creator.engagementRate * 100).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(creator.avgViews || creator.avgLikes)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg Views</p>
            </div>
          </div>

          {/* Platform Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {platform}
            </Badge>
            
            {creator.hasContactDetails && (
              <Badge variant="secondary" className="text-xs">
                Contact Available
              </Badge>
            )}
          </div>

          {/* Quick Action */}
          <Button 
            className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            variant="outline"
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardContent>
      </Card>

      <SaveToListDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        creator={creator}
      />

      <CreatorAnalyticsPanel
        creator={creator}
        platform={platform}
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />
    </>
  );
};
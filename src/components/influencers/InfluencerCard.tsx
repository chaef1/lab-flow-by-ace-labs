import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Instagram, Users, Plus, Eye, RefreshCw } from 'lucide-react';
import { useInfluencerAnalytics } from '@/hooks/useInfluencerAnalytics';
import { toast } from 'sonner';

interface InfluencerCardProps {
  influencer: {
    id: string;
    username?: string;
    full_name?: string;
    profile_picture_url?: string;
    bio?: string;
    follower_count?: number;
    engagement_rate?: number;
    platform: string;
    categories?: string[];
    instagram_handle?: string;
    tiktok_handle?: string;
    youtube_handle?: string;
  };
  campaigns?: Array<{ id: string; name: string; }>;
  pools?: Array<{ id: string; name: string; }>;
  onViewProfile: (influencer: any) => void;
  onAddToPool: (influencer: any) => void;
  onAddToCampaign: (influencer: any) => void;
  onRefresh?: () => void;
}

export function InfluencerCard({ 
  influencer, 
  campaigns = [], 
  pools = [], 
  onViewProfile, 
  onAddToPool, 
  onAddToCampaign,
  onRefresh 
}: InfluencerCardProps) {
  const displayName = influencer.full_name || influencer.username || 'Unknown';
  const handle = influencer.instagram_handle || influencer.tiktok_handle || influencer.username;
  const { updateInfluencerWithAnalytics, loading } = useInfluencerAnalytics();

  const handleRefreshAnalytics = async () => {
    if (!handle) {
      toast.error('No social media handle found for this influencer');
      return;
    }

    try {
      await updateInfluencerWithAnalytics(influencer.id, handle, influencer.platform);
      toast.success('Analytics updated successfully');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update analytics');
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 h-fit">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-primary/10">
          <AvatarImage src={influencer.profile_picture_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm line-clamp-1">{displayName}</h3>
              {handle && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Instagram size={12} className="mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">@{handle}</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {influencer.platform}
            </Badge>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center">
              <Users size={12} className="mr-1 text-blue-500 flex-shrink-0" />
              <span className="truncate">{influencer.follower_count?.toLocaleString() || '0'}</span>
            </span>
            <span className="flex items-center">
              <Star size={12} className="mr-1 text-amber-500 flex-shrink-0" />
              <span>{influencer.engagement_rate || '0'}%</span>
            </span>
          </div>
          
          {/* Bio */}
          {influencer.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {influencer.bio}
            </p>
          )}
          
          {/* Categories */}
          {influencer.categories && influencer.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {influencer.categories.slice(0, 2).map((category, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {influencer.categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{influencer.categories.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          {/* Current assignments */}
          {(campaigns.length > 0 || pools.length > 0) && (
            <div className="space-y-1">
              {campaigns.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Campaigns:</h4>
                  <div className="flex flex-wrap gap-1">
                    {campaigns.slice(0, 2).map(campaign => (
                      <Badge key={campaign.id} variant="default" className="text-xs">
                        {campaign.name}
                      </Badge>
                    ))}
                    {campaigns.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{campaigns.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {pools.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Pools:</h4>
                  <div className="flex flex-wrap gap-1">
                    {pools.slice(0, 2).map(pool => (
                      <Badge key={pool.id} variant="outline" className="text-xs">
                        {pool.name}
                      </Badge>
                    ))}
                    {pools.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{pools.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-1 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onViewProfile(influencer)}
              className="text-xs h-7 px-2"
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onAddToPool(influencer)}
              className="text-xs h-7 px-2"
            >
              <Plus className="mr-1 h-3 w-3" />
              Pool
            </Button>
            <Button 
              size="sm" 
              onClick={() => onAddToCampaign(influencer)}
              className="text-xs h-7 px-2"
            >
              <Plus className="mr-1 h-3 w-3" />
              Campaign
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleRefreshAnalytics}
              disabled={loading}
              className="text-xs h-7 px-2"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Instagram, Users, Plus, Eye } from 'lucide-react';

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
}

export function InfluencerCard({ 
  influencer, 
  campaigns = [], 
  pools = [], 
  onViewProfile, 
  onAddToPool, 
  onAddToCampaign 
}: InfluencerCardProps) {
  const displayName = influencer.full_name || influencer.username || 'Unknown';
  const handle = influencer.instagram_handle || influencer.tiktok_handle || influencer.username;

  return (
    <div className="modern-card swipe-card p-4 md:p-6 swipeable">
      <div className="flex items-start gap-3 md:gap-4">
        <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-primary/20 shadow-md">
          <AvatarImage src={influencer.profile_picture_url || undefined} />
          <AvatarFallback className="gradient-primary text-white font-semibold">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{displayName}</h3>
            <Badge variant="outline" className="text-xs">
              {influencer.platform}
            </Badge>
          </div>
          
          {handle && (
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Instagram size={14} className="mr-1" />
              @{handle}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm mb-3">
            <span className="flex items-center">
              <Users size={14} className="mr-1 text-blue-500" />
              {influencer.follower_count?.toLocaleString() || '0'} followers
            </span>
            <span className="flex items-center">
              <Star size={14} className="mr-1 text-amber-500" />
              {influencer.engagement_rate || '0'}% engagement
            </span>
          </div>
          
          {influencer.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {influencer.bio}
            </p>
          )}
          
          {influencer.categories && influencer.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {influencer.categories.slice(0, 3).map((category, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {influencer.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{influencer.categories.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Current assignments */}
          <div className="space-y-2 mb-4">
            {campaigns.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Campaigns:</h4>
                <div className="flex flex-wrap gap-1">
                  {campaigns.map(campaign => (
                    <Badge key={campaign.id} variant="default" className="text-xs">
                      {campaign.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {pools.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Pools:</h4>
                <div className="flex flex-wrap gap-1">
                  {pools.map(pool => (
                    <Badge key={pool.id} variant="outline" className="text-xs">
                      {pool.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onViewProfile(influencer)}
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onAddToPool(influencer)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Pool
            </Button>
            <Button 
              size="sm" 
              onClick={() => onAddToCampaign(influencer)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
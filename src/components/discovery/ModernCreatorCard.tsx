import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Bookmark, MoreVertical, CheckCircle, Mail, ExternalLink } from 'lucide-react';
import { ModashCreator } from '@/lib/modash-client';
import { formatNumber } from '@/lib/utils';

interface ModernCreatorCardProps {
  creator: ModashCreator;
  isSelected: boolean;
  onSelect: (creatorId: string, selected: boolean) => void;
  watchlists: Array<{ id: string; name: string }>;
  onAddToWatchlist: (data: { watchlistId: string; creator: ModashCreator }) => void;
  onViewProfile: (creator: ModashCreator) => void;
  variant?: 'grid' | 'list';
}

export const ModernCreatorCard: React.FC<ModernCreatorCardProps> = ({
  creator,
  isSelected,
  onSelect,
  watchlists,
  onAddToWatchlist,
  onViewProfile,
  variant = 'grid',
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (watchlistId?: string) => {
    if (!watchlists.length) return;
    
    setIsSaving(true);
    try {
      const targetWatchlist = watchlistId || watchlists[0].id;
      await onAddToWatchlist({ watchlistId: targetWatchlist, creator });
    } finally {
      setIsSaving(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': 
        return <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-purple-500 to-pink-500" />;
      case 'youtube': 
        return <div className="w-3 h-3 rounded-sm bg-red-600" />;
      case 'tiktok': 
        return <div className="w-3 h-3 rounded-sm bg-black" />;
      default: 
        return <div className="w-3 h-3 rounded-sm bg-gray-500" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'youtube': return 'from-red-500 to-red-600';
      case 'tiktok': return 'from-gray-800 to-black';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  // Handle different variants
  if (variant === 'list') {
    return (
      <Card className="group hover:bg-muted/30 transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Selection & Creator Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(creator.userId, !!checked)}
              />
              
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
                <AvatarFallback>{creator.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getPlatformIcon(creator.platform)}
                  <h3 className="font-semibold text-sm truncate">{creator.username}</h3>
                  {creator.isVerified && (
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                  {creator.hasContactDetails && (
                    <Badge variant="secondary" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                  )}
                </div>
                
                {creator.fullName && (
                  <p className="text-sm text-muted-foreground truncate">{creator.fullName}</p>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-8 mr-4">
              <div className="text-center min-w-0">
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="font-semibold text-sm">{formatNumber(creator.followers || 0)}</p>
              </div>
              
              <div className="text-center min-w-0">
                <p className="text-xs text-muted-foreground">ER%</p>
                <p className="font-semibold text-sm">{creator.engagementRate ? `${(creator.engagementRate * 100).toFixed(1)}%` : 'N/A'}</p>
              </div>

              <div className="text-center min-w-0">
                <p className="text-xs text-muted-foreground">Avg Likes</p>
                <p className="font-semibold text-sm">{formatNumber(creator.avgLikes || 0)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleSave()}>
                <Bookmark className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" onClick={() => onViewProfile(creator)}>
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(creator.userId, !!checked)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 pl-8">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={creator.profilePicUrl} 
                  alt={creator.username}
                />
                <AvatarFallback>
                  {creator.username?.slice(1, 3).toUpperCase() || 'CR'}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r ${getPlatformColor(creator.platform)} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {creator.platform[0]?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">
                  {creator.username}
                </h3>
                {creator.isVerified && (
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
                {creator.hasContactDetails && (
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {creator.platform}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewProfile(creator)}>
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              {watchlists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => handleSave(list.id)}
                  disabled={isSaving}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save to {list.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {formatNumber(creator.followers || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {creator.engagementRate ? `${(creator.engagementRate * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Engagement</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              {formatNumber(creator.avgLikes || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Likes</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              {formatNumber(creator.avgViews || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Views</div>
          </div>
        </div>

        {/* Tags - Only show if creator has report data with interests */}
        {creator.report?.interests && creator.report.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {creator.report.interests.slice(0, 3).map((interest: any, index: number) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                {typeof interest === 'string' ? interest : interest.name}
              </Badge>
            ))}
            {creator.report.interests.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{creator.report.interests.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onViewProfile(creator)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
          <Button
            size="sm"
            variant="default"
            className="flex-1 text-xs"
            onClick={() => handleSave()}
            disabled={isSaving || !watchlists.length}
          >
            <Bookmark className="w-3 h-3 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
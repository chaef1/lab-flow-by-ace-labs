import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Heart, 
  Eye, 
  MessageCircle, 
  TrendingUp,
  Calendar,
  Mail,
  ExternalLink,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { CreatorProfile } from '@/hooks/useCreatorProfile';
import { LoadingSpinner } from './LoadingSpinner';

interface CreatorProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profileData?: CreatorProfile | null;
  isLoading: boolean;
  error?: any;
}

export const CreatorProfileSheet: React.FC<CreatorProfileSheetProps> = ({
  isOpen,
  onClose,
  profileData,
  isLoading,
  error,
}) => {
  if (!profileData && !isLoading) return null;

  const creator = profileData;

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'youtube': return 'bg-red-600';
      case 'tiktok': return 'bg-black';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Failed to load profile data</p>
          </div>
        ) : creator ? (
          <>
            <SheetHeader className="pb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
                    <AvatarFallback>
                      {creator.username?.slice(1, 3).toUpperCase() || 'CR'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getPlatformColor(creator.platform)} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">
                      {creator.platform[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SheetTitle className="text-xl">{creator.username}</SheetTitle>
                    {creator.isVerified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                    {creator.hasContactDetails && (
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {creator.fullName && (
                    <SheetDescription className="text-base">
                      {creator.fullName}
                    </SheetDescription>
                  )}
                  
                  <Badge variant="outline" className="mt-2 capitalize">
                    {creator.platform}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{formatNumber(creator.followers || 0)}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold text-red-500">
                        {creator.engagementRate ? `${(creator.engagementRate * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Heart className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                      <div className="text-2xl font-bold">{formatNumber(creator.avgLikes || 0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Likes</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{formatNumber(creator.avgViews || 0)}</div>
                      <div className="text-sm text-muted-foreground">Avg Views</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Posts */}
              {creator.recentPosts && creator.recentPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {creator.recentPosts.slice(0, 6).map((post: any, index: number) => (
                        <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                          {post.mediaUrl && (
                            <img 
                              src={post.mediaUrl} 
                              alt="Post"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* External Links */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      onClick={() => window.open(`https://${creator.platform}.com/${creator.username}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on {creator.platform}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
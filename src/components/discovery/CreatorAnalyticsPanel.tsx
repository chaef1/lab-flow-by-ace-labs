import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  ExternalLink,
  Play,
  Grid3X3,
  User,
  RefreshCw,
  X,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { useModashRaw } from '@/hooks/useModashRaw';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface CreatorAnalyticsPanelProps {
  creator: {
    userId: string;
    username: string;
    fullName: string;
    profilePicUrl: string;
    followers: number;
    platform: string;
  };
  platform: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorAnalyticsPanel = ({ creator, platform, isOpen, onClose }: CreatorAnalyticsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'posts'>('info');
  const navigate = useNavigate();
  const { useUserInfo, useUserFeed } = useModashRaw();
  
  const { 
    data: userInfo, 
    isLoading: infoLoading, 
    error: infoError,
    refetch: refetchInfo 
  } = useUserInfo(creator.username, platform, isOpen);
  
  const { 
    data: userFeed, 
    isLoading: feedLoading, 
    error: feedError,
    refetch: refetchFeed 
  } = useUserFeed(creator.username, platform, isOpen && activeTab === 'posts');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const handleRefresh = () => {
    if (activeTab === 'info') {
      refetchInfo();
    } else {
      refetchFeed();
    }
  };

  const handleViewFullReport = () => {
    navigate(`/creators/${platform}/${creator.userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold">Creator Analytics</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {platform} RAW API
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
            <AvatarFallback>{creator.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{creator.fullName}</h4>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mt-3">
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('info')}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
          <Button
            variant={activeTab === 'posts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('posts')}
            className="flex-1"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Posts
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Error Alert */}
        {(infoError || feedError) && (
          <Alert className="mb-4">
            <AlertDescription>
              {infoError?.message.includes('credits') ? 
                'Insufficient RAW API credits. Showing basic info only.' :
                feedError?.message.includes('credits') ?
                'Insufficient RAW API credits. Cannot load recent posts.' :
                'Unable to load live data. Limited information available.'
              }
            </AlertDescription>
          </Alert>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            {infoLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : userInfo ? (
              <>
                {/* Bio */}
                {userInfo.biography && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm leading-relaxed">{userInfo.biography}</p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold text-lg">{formatNumber(userInfo.followers)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold text-lg">{formatNumber(userInfo.following)}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold text-lg">{formatNumber(userInfo.posts)}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      {userInfo.isVerified && <span className="text-blue-500">✓</span>}
                      {userInfo.isPrivate && <span className="text-orange-500">🔒</span>}
                      {!userInfo.isVerified && !userInfo.isPrivate && <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">Status</div>
                  </div>
                </div>

                {/* Category */}
                {userInfo.category && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-sm">
                      {userInfo.category}
                    </Badge>
                  </div>
                )}

                {/* External Link */}
                {userInfo.externalUrl && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={userInfo.externalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Live profile data unavailable. Showing basic info from discovery results.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold text-lg">{formatNumber(creator.followers)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold text-lg">—</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {feedLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : userFeed?.posts.length ? (
              <div className="grid grid-cols-2 gap-3">
                {userFeed.posts.slice(0, 8).map((post) => (
                  <div key={post.id} className="group relative">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {post.mediaUrl ? (
                        <div className="relative w-full h-full">
                          <img
                            src={post.mediaUrl}
                            alt={post.caption || 'Post'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          {post.mediaType === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                          )}
                          {post.mediaType === 'carousel' && (
                            <div className="absolute top-1 right-1">
                              <Grid3X3 className="w-3 h-3 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Eye className="w-6 h-6" />
                        </div>
                      )}
                      
                      {/* Hover overlay with stats */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center space-x-3 text-white text-sm">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{formatNumber(post.likes)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{formatNumber(post.comments)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent posts available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may be due to API limitations or privacy settings
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <Button onClick={handleViewFullReport} className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          View Full Report
        </Button>
      </div>
    </div>
  );
};
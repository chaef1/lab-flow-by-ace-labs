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
  RefreshCw
} from 'lucide-react';
import { useModashRaw } from '@/hooks/useModashRaw';
import { Skeleton } from '@/components/ui/skeleton';

interface RawContentPreviewProps {
  username: string;
  platform: string;
  className?: string;
}

export const RawContentPreview = ({ username, platform, className }: RawContentPreviewProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'posts'>('info');
  const { useUserInfo, useUserFeed } = useModashRaw();
  
  const { 
    data: userInfo, 
    isLoading: infoLoading, 
    error: infoError,
    refetch: refetchInfo 
  } = useUserInfo(username, platform);
  
  const { 
    data: userFeed, 
    isLoading: feedLoading, 
    error: feedError,
    refetch: refetchFeed 
  } = useUserFeed(username, platform, activeTab === 'posts');

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

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Content Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {platform} RAW API
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
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
            Recent Posts
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'info' && (
          <div className="space-y-4">
            {infoLoading ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : infoError ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Unable to load profile info
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchInfo()}>
                  Try Again
                </Button>
              </div>
            ) : userInfo ? (
              <>
                {/* Profile Header */}
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={userInfo.profilePicUrl} alt={userInfo.username} />
                    <AvatarFallback>{userInfo.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{userInfo.fullName}</h3>
                      {userInfo.isVerified && (
                        <Badge variant="secondary" className="text-xs">✓</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{userInfo.username}</p>
                    {userInfo.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {userInfo.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {userInfo.biography && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm leading-relaxed">{userInfo.biography}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold">{formatNumber(userInfo.followers)}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold">{formatNumber(userInfo.following)}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold">{formatNumber(userInfo.posts)}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                </div>

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
            ) : null}
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
                    <div className="flex space-x-2">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : feedError ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Unable to load recent posts
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchFeed()}>
                  Try Again
                </Button>
              </div>
            ) : userFeed?.posts.length ? (
              <div className="grid grid-cols-2 gap-3">
                {userFeed.posts.slice(0, 6).map((post) => (
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
                              <Play className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                          )}
                          {post.mediaType === 'carousel' && (
                            <div className="absolute top-2 right-2">
                              <Grid3X3 className="w-4 h-4 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Eye className="w-8 h-8" />
                        </div>
                      )}
                      
                      {/* Hover overlay with stats */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center space-x-4 text-white">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{formatNumber(post.likes)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{formatNumber(post.comments)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Caption preview */}
                    {post.caption && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {post.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent posts found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
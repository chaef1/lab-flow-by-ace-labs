
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Star, Loader2, Lock, Instagram, ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Platform } from "./SearchForm";
import { formatRelativeDate } from "@/lib/utils";

interface ProfileDisplayProps {
  profileData: any; // Using any for now as the profileData structure is complex
  platform: Platform;
  isAuthenticating: boolean;
  onOAuthLogin: (authUrl: string) => void;
}

export function ProfileDisplay({ 
  profileData, 
  platform, 
  isAuthenticating, 
  onOAuthLogin 
}: ProfileDisplayProps) {
  // Helper function to render platform-specific icon
  const PlatformIcon = ({platform}: {platform: Platform}) => {
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

  if (!profileData || profileData.temporary_error) {
    return null;
  }

  return (
    <div className="mt-6 border rounded-lg p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profileData.profile_pic_url} />
          <AvatarFallback>
            {profileData.full_name?.split(' ').map((n: string) => n[0]).join('') || profileData.username?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-lg">{profileData.full_name || profileData.username}</h3>
            {profileData.is_verified && (
              <Badge variant="secondary" className="ml-2">
                <UserCheck className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <PlatformIcon platform={platform} />
            @{profileData.username}
          </div>
        </div>
      </div>
      
      {/* OAuth auth prompt if needed */}
      {profileData.requires_auth && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center text-amber-800">
            <Lock className="h-4 w-4 mr-2" />
            <p className="text-sm">Authentication required to view full profile details</p>
          </div>
          <Button 
            className="w-full mt-2" 
            variant="outline"
            onClick={() => onOAuthLogin(profileData.auth_url)}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? 
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> :
              <><Instagram className="mr-2 h-4 w-4" /> Connect with Instagram</>
            }
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {profileData.posts && profileData.posts.length > 0 && (
            <TabsTrigger value="posts">Posts</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground text-xs">Followers</div>
              <div className="font-medium">{profileData.follower_count?.toLocaleString() || '0'}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground text-xs">Following</div>
              <div className="font-medium">{profileData.following_count?.toLocaleString() || '0'}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground text-xs">Posts</div>
              <div className="font-medium">{profileData.post_count?.toLocaleString() || '0'}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center text-sm mb-1">
              <Star className="h-4 w-4 text-amber-500 mr-1" />
              <span className="font-medium">{profileData.engagement_rate || '0'}% Engagement Rate</span>
            </div>
            <p className="text-sm text-muted-foreground">{profileData.biography || 'No bio available'}</p>
            
            {profileData.website && (
              <p className="text-sm mt-2">
                <a 
                  href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {profileData.website}
                </a>
              </p>
            )}
          </div>
        </TabsContent>
        
        {profileData.posts && profileData.posts.length > 0 && (
          <TabsContent value="posts">
            <div className="grid grid-cols-2 gap-4">
              {profileData.posts.slice(0, 4).map((post: any, index: number) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img 
                      src={post.thumbnail} 
                      alt={`Post by ${profileData.username}`}
                      className="object-cover w-full h-full"
                    />
                    {post.type === 'video' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">
                          Video
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {post.likes?.toLocaleString() || '0'}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {post.comments?.toLocaleString() || '0'}
                      </div>
                      {post.timestamp && (
                        <div className="text-xs">
                          {formatRelativeDate(post.timestamp)}
                        </div>
                      )}
                    </div>
                    {post.caption && (
                      <p className="text-xs line-clamp-2 mt-1">
                        {post.caption}
                      </p>
                    )}
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs text-blue-600"
                      onClick={() => window.open(post.url, '_blank')}
                    >
                      View post
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

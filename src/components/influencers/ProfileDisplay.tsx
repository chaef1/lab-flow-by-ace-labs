
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
  isAuthenticating?: boolean;
  onOAuthLogin?: (authUrl: string) => void;
}

export function ProfileDisplay({ 
  profileData, 
  platform, 
  isAuthenticating = false, 
  onOAuthLogin = () => {} 
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
    <div className="mt-6 border-0 rounded-xl p-6 sm:p-8 bg-gradient-to-br from-background to-muted/30 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-primary/20 mx-auto sm:mx-0">
          <AvatarImage src={profileData.profile_picture_url} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg font-bold">
            {profileData.full_name?.split(' ').map((n: string) => n[0]).join('') || profileData.username?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <h3 className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {profileData.full_name || profileData.username}
            </h3>
            {profileData.verified && (
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 mx-auto sm:mx-0 w-fit">
                <UserCheck className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-center sm:justify-start text-muted-foreground mb-3">
            <PlatformIcon platform={platform} />
            <span className="font-medium">@{profileData.username}</span>
          </div>
          
          <Badge variant="outline" className="text-xs font-medium">
            {profileData.category || 'Influencer'}
          </Badge>
        </div>
      </div>
      
      
      <Tabs defaultValue="profile" className="mt-10">
        <TabsList className="mb-8 bg-muted/50 w-full justify-start">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Profile</TabsTrigger>
          {profileData.analytics && (
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Analytics</TabsTrigger>
          )}
          {profileData.posts && profileData.posts.length > 0 && (
            <TabsTrigger value="posts" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Posts</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">Followers</div>
              <div className="font-bold text-2xl text-blue-800">{profileData.follower_count?.toLocaleString() || '0'}</div>
            </div>
            <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Following</div>
              <div className="font-bold text-2xl text-green-800">{profileData.following_count?.toLocaleString() || '0'}</div>
            </div>
            <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Posts</div>
              <div className="font-bold text-2xl text-purple-800">{profileData.posts_count?.toLocaleString() || '0'}</div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-amber-800">
                {profileData.engagement_rate || '0'}% Engagement Rate
              </span>
            </div>
            
            <div className="p-5 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Biography</h4>
              <p className="text-sm leading-relaxed">{profileData.bio || 'No bio available'}</p>
            </div>
            
            {profileData.website && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-600 mb-2">Website</h4>
                <a 
                  href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                >
                  {profileData.website}
                </a>
              </div>
            )}
          </div>
        </TabsContent>

        {profileData.analytics && (
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Engagement Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-green-600 text-sm font-medium">Engagement Rate</div>
                  <div className="font-bold text-xl text-green-800">
                    {profileData.analytics.engagement?.rate?.toFixed(2) || '0'}%
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-blue-600 text-sm font-medium">Avg Likes</div>
                  <div className="font-bold text-xl text-blue-800">
                    {profileData.analytics.engagement?.avgLikes?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-purple-600 text-sm font-medium">Avg Comments</div>
                  <div className="font-bold text-xl text-purple-800">
                    {profileData.analytics.engagement?.avgComments?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-orange-600 text-sm font-medium">Avg Shares</div>
                  <div className="font-bold text-xl text-orange-800">
                    {profileData.analytics.engagement?.avgShares?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Authenticity Score */}
              {profileData.analytics.authenticity && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <h4 className="font-medium text-indigo-800 mb-3">Authenticity Analysis</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {profileData.analytics.authenticity.score?.toFixed(0) || '0'}
                      </div>
                      <div className="text-sm text-indigo-700">Authenticity Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {profileData.analytics.authenticity.fakeFollowers?.toFixed(1) || '0'}%
                      </div>
                      <div className="text-sm text-red-700">Fake Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {profileData.analytics.authenticity.botComments?.toFixed(1) || '0'}%
                      </div>
                      <div className="text-sm text-yellow-700">Bot Comments</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Demographics */}
              {profileData.analytics.demographics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profileData.analytics.demographics.ageGroups && (
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <h4 className="font-medium text-muted-foreground mb-3">Age Demographics</h4>
                      <div className="space-y-2">
                        {Object.entries(profileData.analytics.demographics.ageGroups).map(([age, percentage]: [string, any]) => (
                          <div key={age} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{age}</span>
                            <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profileData.analytics.demographics.genders && (
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <h4 className="font-medium text-muted-foreground mb-3">Gender Demographics</h4>
                      <div className="space-y-2">
                        {Object.entries(profileData.analytics.demographics.genders).map(([gender, percentage]: [string, any]) => (
                          <div key={gender} className="flex justify-between items-center">
                            <span className="text-sm font-medium capitalize">{gender}</span>
                            <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        )}
        
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

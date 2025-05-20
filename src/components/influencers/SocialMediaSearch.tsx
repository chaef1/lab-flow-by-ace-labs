
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaSearch } from "@/hooks/useSocialMediaSearch";
import { 
  Instagram, 
  Loader2, 
  Search, 
  Star, 
  TrendingUp, 
  UserCheck, 
  AlertCircle, 
  History, 
  Clock, 
  Link, 
  Lock,
  Timer,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InfluencerCardModal } from "./InfluencerCardModal";
import { formatRelativeDate } from "@/lib/utils";

interface SocialMediaSearchProps {
  onAddInfluencer?: (profileData: any) => void;
}

type Platform = 'instagram' | 'tiktok';

export default function SocialMediaSearch({ onAddInfluencer }: SocialMediaSearchProps) {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [username, setUsername] = useState('');
  const [searchTab, setSearchTab] = useState<'search' | 'history'>('search');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { 
    searchProfile, 
    clearProfile, 
    isLoading, 
    profileData,
    rateLimitError,
    searchHistory,
    isHistoryLoading,
    clearSearchHistory,
    profile
  } = useSocialMediaSearch();
  const { toast } = useToast();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [savedProfileData, setSavedProfileData] = useState<any>(null);

  const handleSearch = () => {
    searchProfile(platform, username);
  };

  const handleHistoryItemClick = (platform: Platform, username: string) => {
    setPlatform(platform);
    setUsername(username);
    setSearchTab('search');
    searchProfile(platform, username);
  };

  const handlePlatformChange = (value: string) => {
    setPlatform(value as Platform);
    clearProfile();
    setUsername('');
  };

  const handleOAuthLogin = (authUrl: string) => {
    setIsAuthenticating(true);
    
    // Open the auth URL in a popup window
    const width = 700;
    const height = 750;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      authUrl,
      "oauth-popup",
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    // Check for when the popup is closed
    const checkPopupClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopupClosed);
        setIsAuthenticating(false);
        
        // Could add some logic here to check if auth was successful
        toast({
          title: "Authentication window closed",
          description: "Please try your search again if authentication was successful."
        });
      }
    }, 500);
    
    // Cleanup function in case component unmounts
    return () => {
      if (popup) popup.close();
      clearInterval(checkPopupClosed);
    };
  };

  const handleAddInfluencer = async () => {
    if (!profileData) return;
    
    try {
      // Check if user already exists with the handle
      const { data: existingInfluencer } = await supabase
        .from('influencers')
        .select('id')
        .eq(`${platform}_handle`, profileData.username)
        .maybeSingle();
      
      if (existingInfluencer) {
        toast({
          title: "Influencer already exists",
          description: `This ${platform} profile is already in your database`,
          variant: "default",
        });
        return;
      }
      
      // Generate a new UUID for the profile/influencer
      const newId = crypto.randomUUID();
      
      // Create a new profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newId, // Use the generated UUID
          first_name: profileData.full_name?.split(' ')[0] || '',
          last_name: profileData.full_name?.split(' ').slice(1).join(' ') || '',
          avatar_url: profileData.profile_pic_url || '',
          role: 'influencer'
        });
        
      if (profileError) throw profileError;
      
      // Now create the influencer with the same ID
      const influencerData: any = {
        id: newId, // Use the same ID for the influencer
        bio: profileData.biography || '',
        follower_count: profileData.follower_count || 0,
        engagement_rate: profileData.engagement_rate || 0,
        categories: [],
      };
      
      // Add the right social handle based on platform
      if (platform === 'instagram') {
        influencerData.instagram_handle = profileData.username;
      } else if (platform === 'tiktok') {
        influencerData.tiktok_handle = profileData.username;
      }
      
      const { error: influencerError } = await supabase
        .from('influencers')
        .insert(influencerData);
        
      if (influencerError) throw influencerError;

      // Store the saved profile data for the modal
      const savedData = {
        id: newId,
        first_name: profileData.full_name?.split(' ')[0] || '',
        last_name: profileData.full_name?.split(' ').slice(1).join(' ') || '',
        bio: profileData.biography || '',
        follower_count: profileData.follower_count || 0,
        engagement_rate: profileData.engagement_rate || 0,
        categories: [],
        avatar_url: profileData.profile_pic_url || '',
        instagram_handle: platform === 'instagram' ? profileData.username : null,
        tiktok_handle: platform === 'tiktok' ? profileData.username : null,
        is_mock_data: profileData.is_mock_data || false
      };
      
      setSavedProfileData(savedData);
      setIsCardModalOpen(true);
      
      toast({
        title: "Influencer added",
        description: "Successfully added influencer to your database",
      });
      
      setUsername('');
      clearProfile();
      
      if (onAddInfluencer) {
        onAddInfluencer(profileData);
      }
      
    } catch (error: any) {
      console.error("Error adding influencer:", error);
      toast({
        title: "Failed to add influencer",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

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

  // Render rate limit error UI
  const renderRateLimitError = () => {
    if (!profileData?.temporary_error) return null;
    
    return (
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">API Rate Limit Reached</h3>
            <p className="text-amber-700 mt-1">
              {profileData.message || "The Instagram API is temporarily unavailable due to rate limiting. Please try again in a few minutes."}
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => searchProfile(platform, username)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <div className="text-sm text-amber-600 flex items-center">
                <Timer className="mr-2 h-4 w-4" />
                Typically resolves within 15 minutes
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Find Influencers</CardTitle>
          <CardDescription>
            Search for influencers by their social media handles or profile URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" value={searchTab} onValueChange={(v) => setSearchTab(v as 'search' | 'history')}>
            <TabsList className="mb-4">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
              <Tabs defaultValue="instagram" value={platform} onValueChange={handlePlatformChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="instagram">Instagram</TabsTrigger>
                  <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                </TabsList>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground mb-2">
                    {platform === 'instagram' ? (
                      <div className="flex items-center">
                        <Link className="h-4 w-4 mr-1" />
                        Enter Instagram username or profile URL
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Link className="h-4 w-4 mr-1" />
                        Enter TikTok username
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={platform === 'instagram' 
                          ? "Username or instagram.com/username" 
                          : "Username"
                        }
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button onClick={handleSearch} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Search
                    </Button>
                  </div>
                </div>
                
                {platform === 'instagram' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Example URL: https://www.instagram.com/username
                    </p>
                  </div>
                )}
                
                {/* Rate limit error message */}
                {renderRateLimitError()}
                
                {/* Profile data display */}
                {profileData && !profileData.temporary_error && (
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
                          onClick={() => handleOAuthLogin(profileData.auth_url)}
                          disabled={isAuthenticating}
                        >
                          {isAuthenticating ? 
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> :
                            <><Instagram className="mr-2 h-4 w-4" /> Connect with Instagram</>
                          }
                        </Button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
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
                      <p className="text-sm text-muted-foreground line-clamp-2">{profileData.biography || 'No bio available'}</p>
                    </div>
                  </div>
                )}
              </Tabs>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Recent Searches</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSearchHistory}
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
                        onClick={() => handleHistoryItemClick(item.platform as Platform, item.username)}
                      >
                        <div className="flex items-center gap-3">
                          <PlatformIcon platform={item.platform as Platform} />
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
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {profileData && !profileData.temporary_error && searchTab === 'search' && !profileData.requires_auth && (
          <CardFooter>
            <Button className="w-full" onClick={handleAddInfluencer}>
              <TrendingUp className="mr-2 h-4 w-4" /> 
              Add to Influencer Database
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Tinder Card Modal */}
      <InfluencerCardModal
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        influencerData={savedProfileData}
      />
    </>
  );
}

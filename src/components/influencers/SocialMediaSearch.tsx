
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaSearch } from "@/hooks/useSocialMediaSearch";
import { TrendingUp, History, Instagram, Youtube, Linkedin, Twitter, Facebook } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InfluencerCardModal } from "./InfluencerCardModal";
import { SearchForm } from "./SearchForm";
import { RateLimitError } from "./RateLimitError";
import { ProfileDisplay } from "./ProfileDisplay";
import { SearchHistory } from "./SearchHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type Platform = 'instagram' | 'tiktok' | 'facebook';

interface SocialMediaSearchProps {
  onAddInfluencer?: (profileData: any) => void;
}

export default function SocialMediaSearch({ onAddInfluencer }: SocialMediaSearchProps) {
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'facebook'>('instagram');
  const [username, setUsername] = useState('');
  const [searchTab, setSearchTab] = useState<'search' | 'history'>('search');
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


  const handleAddInfluencer = async () => {
    if (!profileData) return;
    
    try {
      // Check if user already exists with the handle based on platform
      let existingInfluencer = null;
      if (platform === 'instagram') {
        const { data } = await supabase
          .from('influencers')
          .select('id')
          .eq('username', profileData.username)
          .eq('platform', 'instagram')
          .maybeSingle();
        existingInfluencer = data;
      } else if (platform === 'tiktok') {
        const { data } = await supabase
          .from('influencers')
          .select('id')
          .eq('username', profileData.username)
          .eq('platform', 'tiktok')
          .maybeSingle();
        existingInfluencer = data;
      } else if (platform === 'facebook') {
        const { data } = await supabase
          .from('influencers')
          .select('id')
          .eq('username', profileData.username)
          .eq('platform', 'facebook')
          .maybeSingle();
        existingInfluencer = data;
      }
      
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
          id: newId,
          first_name: profileData.full_name?.split(' ')[0] || '',
          last_name: profileData.full_name?.split(' ').slice(1).join(' ') || '',
          avatar_url: profileData.profile_picture_url || '',
          role: 'influencer'
        });
        
      if (profileError) throw profileError;
      
      // Now create the influencer with the new schema
      const influencerData: any = {
        id: newId,
        username: profileData.username,
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        follower_count: profileData.follower_count || 0,
        engagement_rate: profileData.engagement_rate || 0,
        profile_picture_url: profileData.profile_picture_url || '',
        verified: profileData.verified || false,
        website: profileData.website || '',
        location: profileData.location || '',
        account_type: profileData.account_type || '',
        avg_likes: profileData.avg_likes || 0,
        avg_comments: profileData.avg_comments || 0,
        platform: platform,
        categories: [],
      };
      
      // Add legacy social handles for backward compatibility
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
        bio: profileData.bio || '',
        follower_count: profileData.follower_count || 0,
        engagement_rate: profileData.engagement_rate || 0,
        categories: [],
        avatar_url: profileData.profile_picture_url || '',
        username: profileData.username,
        platform: platform,
        instagram_handle: platform === 'instagram' ? profileData.username : null,
        tiktok_handle: platform === 'tiktok' ? profileData.username : null,
        is_mock_data: false
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

  return (
    <>
      <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-background to-muted/50">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Find Influencers
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Search for influencers across all major social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <Tabs defaultValue="search" value={searchTab} onValueChange={(v) => setSearchTab(v as 'search' | 'history')}>
            <TabsList className="mb-6 sm:mb-8 bg-muted/30 w-full sm:w-auto">
              <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-white text-sm px-4 py-2">
                Profile Search
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white text-sm px-4 py-2">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
              <Tabs defaultValue="instagram" value={platform} onValueChange={handlePlatformChange}>
                <TabsList className="grid grid-cols-3 mb-6 sm:mb-8 h-auto p-2 bg-muted/50 gap-2">
                  <TabsTrigger value="instagram" className="flex flex-col sm:flex-row items-center gap-2 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 rounded-lg text-sm">
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm font-medium">Instagram</span>
                  </TabsTrigger>
                  <TabsTrigger value="tiktok" className="flex flex-col sm:flex-row items-center gap-2 p-3 sm:p-4 bg-gradient-to-r from-black to-gray-800 text-white border-0 data-[state=active]:from-gray-900 data-[state=active]:to-black rounded-lg text-sm">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 text-white font-bold text-sm flex items-center justify-center">♪</div>
                    <span className="text-sm font-medium">TikTok</span>
                  </TabsTrigger>
                  <TabsTrigger value="facebook" className="flex flex-col sm:flex-row items-center gap-2 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 rounded-lg text-sm">
                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm font-medium">Facebook</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="instagram" className="space-y-4">
                  <SearchForm
                    platform="instagram"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  {/* Rate limit error message */}
                  {profileData?.temporary_error && (
                    <RateLimitError 
                      message={profileData.message} 
                      onRetry={() => searchProfile('instagram', username)}
                    />
                  )}
                  
                  {/* Profile data display */}
                  <ProfileDisplay
                    profileData={profileData}
                    platform="instagram"
                  />
                </TabsContent>
                
                <TabsContent value="tiktok" className="space-y-4">
                  <SearchForm
                    platform="tiktok"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  <ProfileDisplay
                    profileData={profileData}
                    platform="tiktok"
                  />
                </TabsContent>

                
                <TabsContent value="facebook" className="space-y-4">
                  <SearchForm
                    platform="facebook"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  <ProfileDisplay
                    profileData={profileData}
                    platform="facebook"
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="history">
              <SearchHistory
                searchHistory={searchHistory}
                isHistoryLoading={isHistoryLoading}
                onClearHistory={clearSearchHistory}
                onHistoryItemClick={handleHistoryItemClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {profileData && !profileData.temporary_error && searchTab === 'search' && (
          <CardFooter className="p-6 sm:p-8 pt-0">
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white h-12 text-lg font-medium" 
              onClick={handleAddInfluencer}
            >
              <TrendingUp className="mr-2 h-5 w-5" /> 
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

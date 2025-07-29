
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

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';

interface SocialMediaSearchProps {
  onAddInfluencer?: (profileData: any) => void;
}

export default function SocialMediaSearch({ onAddInfluencer }: SocialMediaSearchProps) {
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin'>('instagram');
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
          .eq('instagram_handle', profileData.username)
          .maybeSingle();
        existingInfluencer = data;
      } else if (platform === 'tiktok') {
        const { data } = await supabase
          .from('influencers')
          .select('id')
          .eq('tiktok_handle', profileData.username)
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
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="search" value={searchTab} onValueChange={(v) => setSearchTab(v as 'search' | 'history')}>
            <TabsList className="mb-4 sm:mb-6 bg-muted/30 w-full sm:w-auto">
              <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-white text-sm">
                Profile Search
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white text-sm">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
              <Tabs defaultValue="instagram" value={platform} onValueChange={handlePlatformChange}>
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6 h-auto p-1 bg-muted/50 gap-1">
                  <TabsTrigger value="instagram" className="flex flex-col sm:flex-row items-center gap-1 p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 rounded-md text-xs">
                    <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs">Instagram</span>
                  </TabsTrigger>
                  <TabsTrigger value="tiktok" className="flex flex-col sm:flex-row items-center gap-1 p-2 sm:p-3 bg-gradient-to-r from-black to-gray-800 text-white border-0 data-[state=active]:from-gray-900 data-[state=active]:to-black rounded-md text-xs">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 text-white font-bold text-xs flex items-center justify-center">♪</div>
                    <span className="text-xs">TikTok</span>
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex flex-col sm:flex-row items-center gap-1 p-2 sm:p-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 data-[state=active]:from-red-600 data-[state=active]:to-red-700 rounded-md text-xs">
                    <Youtube className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs">YouTube</span>
                  </TabsTrigger>
                  <TabsTrigger value="facebook" className="flex flex-col sm:flex-row items-center gap-1 p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 rounded-md text-xs">
                    <Facebook className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs">Facebook</span>
                  </TabsTrigger>
                  <TabsTrigger value="twitter" className="flex flex-col sm:flex-row items-center gap-1 p-2 sm:p-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white border-0 data-[state=active]:from-sky-500 data-[state=active]:to-blue-600 rounded-md text-xs">
                    <Twitter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs">Twitter</span>
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="flex flex-col sm:flex-row items-center gap-1 p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 rounded-md text-xs">
                    <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs">LinkedIn</span>
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

                <TabsContent value="youtube" className="space-y-4">
                  <SearchForm
                    platform="youtube"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  <ProfileDisplay
                    profileData={profileData}
                    platform="youtube"
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

                <TabsContent value="twitter" className="space-y-4">
                  <SearchForm
                    platform="twitter"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  <ProfileDisplay
                    profileData={profileData}
                    platform="twitter"
                  />
                </TabsContent>

                <TabsContent value="linkedin" className="space-y-4">
                  <SearchForm
                    platform="linkedin"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  <ProfileDisplay
                    profileData={profileData}
                    platform="linkedin"
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
          <CardFooter>
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white" onClick={handleAddInfluencer}>
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

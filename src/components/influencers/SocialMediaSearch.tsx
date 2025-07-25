
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaSearch } from "@/hooks/useSocialMediaSearch";
import { TrendingUp, History, Instagram } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InfluencerCardModal } from "./InfluencerCardModal";
import { SearchForm, Platform } from "./SearchForm";
import { RateLimitError } from "./RateLimitError";
import { ProfileDisplay } from "./ProfileDisplay";
import { SearchHistory } from "./SearchHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { hasMetaToken, hasTikTokToken } from "@/lib/ads-api";
import MetaCreatorSearch from './MetaCreatorSearch';

interface SocialMediaSearchProps {
  onAddInfluencer?: (profileData: any) => void;
}

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
  const isMetaConnected = hasMetaToken();

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
              <TabsTrigger value="search">Profile Search</TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
              <Tabs defaultValue="instagram" value={platform} onValueChange={handlePlatformChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="instagram">Instagram Search</TabsTrigger>
                  {isMetaConnected && <TabsTrigger value="meta">Meta Creator Search</TabsTrigger>}
                  <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                </TabsList>
                
                <TabsContent value="instagram">
                  {!isMetaConnected && (
                    <Alert variant="warning" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Connect your Meta account to enhance Instagram search capabilities.
                        Visit the Advertising page to connect your account.
                      </AlertDescription>
                    </Alert>
                  )}
                  
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
                    isAuthenticating={isAuthenticating}
                    onOAuthLogin={handleOAuthLogin}
                  />
                </TabsContent>
                
                {isMetaConnected && (
                  <TabsContent value="meta">
                    <MetaCreatorSearch onAddInfluencer={() => onAddInfluencer?.(null)} />
                  </TabsContent>
                )}
                
                <TabsContent value="tiktok">
                  <SearchForm
                    platform="tiktok"
                    username={username}
                    isLoading={isLoading}
                    onUsernameChange={setUsername}
                    onSearch={handleSearch}
                  />
                  
                  {/* Rate limit error message */}
                  {profileData?.temporary_error && (
                    <RateLimitError 
                      message={profileData.message} 
                      onRetry={() => searchProfile('tiktok', username)}
                    />
                  )}
                  
                  {/* Profile data display */}
                  <ProfileDisplay
                    profileData={profileData}
                    platform="tiktok"
                    isAuthenticating={isAuthenticating}
                    onOAuthLogin={handleOAuthLogin}
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

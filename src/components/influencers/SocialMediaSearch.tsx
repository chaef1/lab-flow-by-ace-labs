import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaSearch } from "@/hooks/useSocialMediaSearch";
import { Instagram, Loader2, Search, Star, TrendingUp, UserCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InfluencerCardModal } from "./InfluencerCardModal";

interface SocialMediaSearchProps {
  onAddInfluencer?: (profileData: any) => void;
}

export default function SocialMediaSearch({ onAddInfluencer }: SocialMediaSearchProps) {
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [username, setUsername] = useState('');
  const { searchProfile, clearProfile, isLoading, profileData } = useSocialMediaSearch();
  const { toast } = useToast();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [savedProfileData, setSavedProfileData] = useState<any>(null);

  const handleSearch = () => {
    searchProfile(platform, username);
  };

  const handlePlatformChange = (value: string) => {
    setPlatform(value as 'instagram' | 'tiktok');
    clearProfile();
    setUsername('');
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
        description: profileData.is_mock_data 
          ? "Added influencer with generated profile data" 
          : "Successfully added influencer to your database",
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
  const PlatformIcon = () => {
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

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Find Influencers</CardTitle>
          <CardDescription>
            Search for influencers by their social media handles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instagram" value={platform} onValueChange={handlePlatformChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Enter ${platform} username`}
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
            
            {profileData && (
              <div className="mt-6 border rounded-lg p-4">
                {profileData.is_mock_data && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                    <span>
                      Using generated data due to API limitations. 
                      This profile can still be added to your database.
                    </span>
                  </div>
                )}
                
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
                      <PlatformIcon />
                      @{profileData.username}
                    </div>
                  </div>
                </div>
                
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
        </CardContent>
        
        {profileData && (
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

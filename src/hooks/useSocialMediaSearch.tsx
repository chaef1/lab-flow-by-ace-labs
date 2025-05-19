
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type SocialPlatform = 'instagram' | 'tiktok';

interface SocialProfileResult {
  username: string;
  full_name?: string;
  biography?: string;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  is_verified?: boolean;
  profile_pic_url?: string;
  engagement_rate?: number;
  error?: string;
}

export const useSocialMediaSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<SocialProfileResult | null>(null);
  const { toast } = useToast();

  const searchProfile = async (platform: SocialPlatform, username: string) => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to search",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProfileData(null);

    try {
      console.log(`Calling Supabase function for ${platform} profile: ${username}`);
      
      const { data, error } = await supabase.functions.invoke('social-profile', {
        body: {
          platform,
          username: username.replace('@', ''), // Remove @ if present
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Response from social-profile function:", data);

      if (data.error) {
        toast({
          title: "Profile not found",
          description: `Could not find ${platform} profile for @${username}`,
          variant: "destructive",
        });
        setProfileData(null);
      } else {
        // Normalize data to ensure it matches our expected interface
        const normalizedData: SocialProfileResult = {
          username: data.username || username,
          full_name: data.full_name,
          biography: data.biography,
          follower_count: data.follower_count,
          following_count: data.following_count, 
          post_count: data.post_count,
          is_verified: data.is_verified,
          profile_pic_url: data.profile_pic_url,
          engagement_rate: data.engagement_rate || 0
        };
        
        console.log("Normalized profile data:", normalizedData);
        setProfileData(normalizedData);
        toast({
          title: "Profile found",
          description: `Found ${platform} profile for @${username}`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching social profile:", error);
      toast({
        title: "Search failed",
        description: error.message || "Could not search for profile",
        variant: "destructive",
      });
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearProfile = () => {
    setProfileData(null);
  };

  return {
    searchProfile,
    clearProfile,
    isLoading,
    profileData,
  };
};

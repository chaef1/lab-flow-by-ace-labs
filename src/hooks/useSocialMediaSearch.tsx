
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
        setProfileData(data);
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

  return {
    searchProfile,
    isLoading,
    profileData,
  };
};

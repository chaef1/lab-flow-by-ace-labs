
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  is_mock_data?: boolean;
  requires_auth?: boolean;
  auth_url?: string;
}

interface SearchHistoryItem {
  id: string;
  platform: SocialPlatform;
  username: string;
  timestamp: string;
  user_id: string;
}

export const useSocialMediaSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<SocialProfileResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load search history on component mount
  useEffect(() => {
    if (user) {
      fetchSearchHistory();
    }
  }, [user]);

  // Check URL for OAuth callback parameters
  useEffect(() => {
    // Check if the current URL has OAuth parameters
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // If we have a code and state from Instagram OAuth
    if (code && (url.pathname.includes('/auth/instagram/callback') || state)) {
      handleOAuthCallback(code, state);
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string, state: string | null) => {
    console.log("OAuth callback received with code:", code);
    
    try {
      // Here we would process the OAuth response
      // For now, we'll just show a success message
      toast({
        title: "Instagram connected",
        description: "You've successfully authenticated with Instagram",
      });
      
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Could not complete authentication with Instagram",
        variant: "destructive",
      });
    }
  };

  // Fetch search history for current user
  const fetchSearchHistory = async () => {
    if (!user) return;
    
    setIsHistoryLoading(true);
    try {
      // Get searches from the last 24 hours only
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      // Use any() to work around type issues
      const { data, error } = await (supabase as any)
        .from('social_media_searches')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', oneDayAgo.toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      // Cast the data to our interface type
      setSearchHistory(data as SearchHistoryItem[] || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Save search to history
  const saveSearchToHistory = async (platform: SocialPlatform, username: string) => {
    if (!user) return;
    
    try {
      // Use any() to work around type issues
      const { error } = await (supabase as any)
        .from('social_media_searches')
        .insert({
          platform,
          username,
          user_id: user.id,
          timestamp: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Refresh history after adding new item
      fetchSearchHistory();
    } catch (error) {
      console.error('Error saving to search history:', error);
    }
  };

  // Clear search history
  const clearSearchHistory = async () => {
    if (!user) return;
    
    try {
      // Use any() to work around type issues
      const { error } = await (supabase as any)
        .from('social_media_searches')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSearchHistory([]);
      toast({
        title: "History cleared",
        description: "Your search history has been cleared",
      });
    } catch (error: any) {
      console.error('Error clearing search history:', error);
      toast({
        title: "Error",
        description: "Failed to clear search history",
        variant: "destructive",
      });
    }
  };

  // Extract username from Instagram URL
  const extractInstagramUsername = (input: string): string => {
    // Handle various Instagram URL formats
    if (input.includes('instagram.com')) {
      // Try to extract username from URL
      const urlRegex = /instagram\.com\/([^\/\?#]+)/;
      const match = input.match(urlRegex);
      if (match && match[1]) {
        // Remove trailing slashes if present
        return match[1].replace(/\/$/, '');
      }
    }
    
    // If it's not a URL or extraction failed, return the input as-is (might be a username)
    return input.replace('@', '');
  };

  const searchProfile = async (platform: SocialPlatform, input: string, oauthCode?: string) => {
    if (!input) {
      toast({
        title: "Username required",
        description: "Please enter a username or profile URL to search",
        variant: "destructive",
      });
      return;
    }

    // Process the input differently based on platform
    let username = input;
    if (platform === 'instagram') {
      username = extractInstagramUsername(input);
    } else {
      // For TikTok just remove @ if present
      username = input.replace('@', '');
    }

    // If we couldn't extract a valid username
    if (!username) {
      toast({
        title: "Invalid input",
        description: `Could not extract a valid ${platform} username from the input`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProfileData(null);

    try {
      console.log(`Calling Supabase function for ${platform} profile: ${username}`);
      
      // Add the OAuth code to the request if provided
      const requestBody: any = {
        platform,
        username,
      };
      
      if (oauthCode) {
        requestBody.code = oauthCode;
      }
      
      const { data, error } = await supabase.functions.invoke('social-profile', {
        body: requestBody,
      });

      if (error) {
        throw new Error(error.message || 'Error calling social-profile function');
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
          full_name: data.full_name || data.fullName || data.display_name || '',
          biography: data.biography || data.bio || data.bio_description || '',
          follower_count: data.follower_count || data.followers || data.followerCount || 0,
          following_count: data.following_count || data.following || data.followingCount || 0, 
          post_count: data.post_count || data.posts || data.videoCount || 0,
          is_verified: data.is_verified || data.verified || false,
          profile_pic_url: data.profile_pic_url || data.avatar || data.avatarUrl || data.avatar_url || '',
          engagement_rate: data.engagement_rate || 0,
          is_mock_data: data.is_mock_data || false,
          requires_auth: data.requires_auth || false,
          auth_url: data.auth_url || ''
        };
        
        console.log("Normalized profile data:", normalizedData);
        setProfileData(normalizedData);
        
        // Save successful search to history
        saveSearchToHistory(platform, username);
        
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
    searchHistory,
    isHistoryLoading,
    clearSearchHistory,
    fetchSearchHistory,
    handleOAuthCallback,
  };
};

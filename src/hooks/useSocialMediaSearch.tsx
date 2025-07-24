
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { hasMetaToken, getSavedMetaToken } from "@/lib/storage/token-storage";

export type SocialProfile = {
  username: string;
  fullName: string;
  followersCount: number;
  followingCount?: number;
  postsCount?: number;
  profilePicture: string;
  bio?: string;
  engagementRate?: number;
  verified?: boolean;
  website?: string;
  recentPosts?: {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
    likes?: number;
    comments?: number;
    caption?: string;
    postedAt?: Date;
  }[];
  error?: string;
  temporary_error?: boolean;
  message?: string;
};

/**
 * Custom hook for searching and fetching social media profiles
 */
export function useSocialMediaSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [searchHistory, setSearchHistory] = useState<Array<{
    id: string;
    username: string;
    platform: string;
    timestamp: string;
  }>>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const { user } = useAuth();

  const searchProfile = useCallback(async (platform: string, username: string) => {
    if (!username) {
      toast.error('Please enter a username');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    setProfile(null);
    setProfileData(null);
    setRateLimitError(false);
    
    try {
      console.log(`Searching for ${username} on ${platform}...`);
      
      // Remove @ symbol if present
      const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
      
      // Check if this is an Instagram search and we have a Meta token
      const isMetaConnected = hasMetaToken();
      if (platform === 'instagram' && isMetaConnected) {
        console.log('Using Meta Graph API for Instagram search');
        const { accessToken } = getSavedMetaToken();
        
        // Call the meta-creators edge function with our token
        const { data: metaData, error: metaError } = await supabase.functions.invoke('meta-creators', {
          body: { 
            action: 'search_creators',
            query: cleanUsername,
            accessToken
          }
        });
        
        if (metaError) {
          console.error('Meta search error:', metaError);
          // Fall back to regular API if Meta search fails
        } else if (metaData && metaData.data && metaData.data.length > 0) {
          // Find the most relevant creator match
          const creator = metaData.data.find((c: any) => 
            c.username.toLowerCase() === cleanUsername.toLowerCase()
          ) || metaData.data[0];
          
          const socialProfile: SocialProfile = {
            username: creator.username,
            fullName: creator.name,
            followersCount: creator.follower_count || 0,
            followingCount: 0,
            postsCount: creator.media_count || 0,
            profilePicture: creator.profile_picture_url,
            bio: creator.biography || '',
            verified: creator.is_verified || false,
            engagementRate: 0, // We don't have this data from the Graph API
            website: '',
            recentPosts: []
          };
          
          setProfile(socialProfile);
          setProfileData({
            username: creator.username,
            full_name: creator.name,
            biography: creator.biography || '',
            follower_count: creator.follower_count || 0,
            following_count: 0,
            post_count: creator.media_count || 0,
            is_verified: creator.is_verified || false,
            profile_pic_url: creator.profile_picture_url,
            website: '',
            category: creator.category
          });
          
          // Log the search in the database if user is authenticated
          if (user) {
            await supabase.from('social_media_searches').insert([
              {
                user_id: user.id,
                platform,
                username: cleanUsername
              }
            ]);
          }
          
          return socialProfile;
        }
      }
      
      // Log the search in the database if user is authenticated
      if (user) {
        await supabase.from('social_media_searches').insert([
          {
            user_id: user.id,
            platform,
            username: cleanUsername
          }
        ]);
      }
      
      // Call our Supabase Edge Function for regular search
      console.log('Calling social-profile edge function for:', cleanUsername);
      
      // Get access token if available for the platform
      let accessToken;
      if (platform === 'instagram' && isMetaConnected) {
        const metaToken = getSavedMetaToken();
        accessToken = metaToken.accessToken;
      }
      
      const { data, error: functionError } = await supabase.functions.invoke('social-profile', {
        body: { 
          platform, 
          username: cleanUsername,
          accessToken 
        },
      });
      
      if (functionError) {
        console.error('Edge function error:', functionError);
        setError(functionError.message);
        toast.error(`Failed to fetch profile: ${functionError.message}`);
        return null;
      }
      
      // Check for rate limiting errors in the response
      if (data.error) {
        console.error('Profile error:', data.error);
        
        if (data.error.includes('rate limit') || data.error.includes('Rate limit')) {
          setError('Rate limit exceeded. Please try again later or use a different API key.');
          toast.error('API rate limit exceeded. Please try again in a few minutes.');
          setRateLimitError(true);
          
          // Also set a modified profile object with temporary error flag
          const errorProfile = {
            username: cleanUsername,
            fullName: '',
            followersCount: 0,
            profilePicture: '',
            temporary_error: true,
            message: data.error
          };
          setProfile(errorProfile as SocialProfile);
          setProfileData(errorProfile);
        } else {
          setError(data.error);
          toast.error(`Error: ${data.error}`);
        }
        return null;
      }
      
      console.log('Profile data received:', data);
      
      if (!data || !data.profile) {
        setError('No profile data returned');
        toast.error('No profile found or API error occurred');
        return null;
      }
      
      const socialProfile: SocialProfile = {
        username: data.profile.username || cleanUsername,
        fullName: data.profile.fullName || '',
        followersCount: data.profile.followersCount || 0,
        followingCount: data.profile.followingCount,
        postsCount: data.profile.postsCount,
        profilePicture: data.profile.profilePicture || '',
        bio: data.profile.bio,
        engagementRate: data.profile.engagementRate,
        verified: data.profile.verified || false,
        website: data.profile.website,
        recentPosts: data.profile.recentPosts || []
      };
      
      setProfile(socialProfile);
      setProfileData(data.profile);
      
      // Fetch search history after successful search
      if (user) {
        fetchSearchHistory();
      }
      
      return socialProfile;
    } catch (err: any) {
      console.error('Search error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  const clearProfile = useCallback(() => {
    setProfile(null);
    setProfileData(null);
    setError(null);
    setRateLimitError(false);
  }, []);
  
  const retrySearch = useCallback(async () => {
    if (!profile && error) {
      toast.info('Retrying search...');
      return;
    }
    
    if (profile) {
      const platform = 'instagram'; // Default retry platform
      return searchProfile(platform, profile.username);
    }
  }, [profile, error, searchProfile]);
  
  const fetchSearchHistory = useCallback(async () => {
    if (!user) return;
    
    setIsHistoryLoading(true);
    
    try {
      const { data, error: historyError } = await supabase
        .from('social_media_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (historyError) {
        console.error('Error fetching search history:', historyError);
        return;
      }
      
      setSearchHistory(data || []);
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [user]);
  
  const clearSearchHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('social_media_searches')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) {
        console.error('Error clearing search history:', deleteError);
        toast.error('Failed to clear search history');
        return;
      }
      
      setSearchHistory([]);
      toast.success('Search history cleared');
    } catch (err) {
      console.error('Failed to clear search history:', err);
      toast.error('An error occurred while clearing search history');
    }
  }, [user]);
  
  return {
    isLoading,
    error,
    profile,
    profileData,
    searchHistory,
    searchProfile,
    retrySearch,
    fetchSearchHistory,
    clearSearchHistory,
    clearProfile,
    rateLimitError,
    isHistoryLoading
  };
}

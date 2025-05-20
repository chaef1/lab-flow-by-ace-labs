import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
      
      // Call our Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('social-profile', {
        body: { platform, username: cleanUsername },
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
      
      console.log('Profile data:', data);
      
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
      // We don't have the previous search parameters here
      // This would be improved if we stored the last search parameters
      return;
    }
    
    if (profile) {
      const platform = profile.username.includes('@') ? 'instagram' : 'tiktok'; // Simple heuristic
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

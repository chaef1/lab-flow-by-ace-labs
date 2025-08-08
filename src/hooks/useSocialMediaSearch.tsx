
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
      console.log(`Searching for ${username} on ${platform} using Ayrshare...`);
      
      // Remove @ symbol if present
      const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
      
      // Log the search in the database if user is authenticated
      if (user) {
        // Get user's organization_id
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();
          
        await supabase.from('social_media_searches').insert([
          {
            user_id: user.id,
            organization_id: userProfile?.organization_id,
            platform,
            username: cleanUsername
          }
        ]);
      }
      
      // Get profile data from brand lookup (public data only)
      const { data: profileData, error: profileError } = await supabase.functions.invoke('ayrshare-brand-lookup', {
        body: { 
          username: cleanUsername,
          platform: platform
        },
      });
      
      if (profileError) {
        console.error('Ayrshare profile function error:', profileError);
        setError(profileError.message);
        toast.error(`Failed to fetch profile: ${profileError.message}`);
        return null;
      }
      
      if (!profileData.success) {
        console.error('Profile error:', profileData.error);
        setError(profileData.error);
        toast.error(`Error: ${profileData.error}`);
        return null;
      }
      
      console.log('Ayrshare profile data received:', profileData.profile);
      
      if (!profileData || !profileData.profile) {
        setError('No profile data returned');
        toast.error('No profile found or API error occurred');
        return null;
      }
      
      // Transform Ayrshare data to our SocialProfile format
      const socialProfile: SocialProfile = {
        username: profileData.profile.username || cleanUsername,
        fullName: profileData.profile.full_name || '',
        followersCount: profileData.profile.follower_count || 0,
        followingCount: profileData.profile.following_count || 0,
        postsCount: profileData.profile.posts_count || 0,
        profilePicture: profileData.profile.profile_picture_url || '',
        bio: profileData.profile.bio || '',
        engagementRate: profileData.profile.engagement_rate || 0,
        verified: profileData.profile.verified || false,
        website: profileData.profile.website || '',
        recentPosts: []
      };
      
      setProfile(socialProfile);
      setProfileData({
        username: profileData.profile.username,
        full_name: profileData.profile.full_name,
        bio: profileData.profile.bio,
        follower_count: profileData.profile.follower_count,
        following_count: profileData.profile.following_count,
        posts_count: profileData.profile.posts_count,
        verified: profileData.profile.verified,
        profile_picture_url: profileData.profile.profile_picture_url,
        website: profileData.profile.website,
        category: profileData.profile.category,
        platform: profileData.profile.platform,
        engagement_rate: profileData.profile.engagement_rate || 0,
        avg_likes: profileData.profile.avg_likes || 0,
        avg_comments: profileData.profile.avg_comments || 0,
        account_type: profileData.profile.account_type,
        location: profileData.profile.location
      });
      
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

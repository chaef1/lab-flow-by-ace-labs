import { useState, useCallback } from 'react';
import { useModashRaw } from './useModashRaw';
import { useLocalCreatorSearch } from './useLocalCreatorSearch';

export interface CreatorProfile {
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  isPrivate: boolean;
  hasContactDetails?: boolean;
  biography?: string;
  externalUrl?: string;
  category?: string;
  engagementRate?: number;
  avgLikes?: number;
  avgViews?: number;
  recentPosts?: any[];
  collaborations?: any[];
  audienceInsights?: any;
  platform: string;
}

export const useCreatorProfile = () => {
  const [profileData, setProfileData] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { 
    fetchUserInfo, 
    fetchUserFeed,
    fetchUserReels 
  } = useModashRaw();
  const { getCreatorDetails } = useLocalCreatorSearch();

  const openProfile = useCallback(async (creator: { 
    username: string; 
    platform: string; 
    userId?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      console.log('Loading profile for:', creator.username, creator.platform);

      // Get basic profile info (from database cache if available, otherwise API)
      const profileInfo = await getCreatorDetails(creator.username, creator.platform);

      // Get additional data from RAW API
      const [feedData, reelsData] = await Promise.allSettled([
        fetchUserFeed(creator.username, creator.platform, 12),
        creator.platform === 'instagram' ? fetchUserReels(creator.username, 6) : Promise.resolve({ posts: [] })
      ]);

      // Combine all data - handle both LocalCreator and RawUserInfo types
      const combinedProfile: CreatorProfile = {
        userId: (profileInfo as any).user_id || (profileInfo as any).userId || creator.userId || '',
        username: profileInfo.username || creator.username,
        fullName: (profileInfo as any).full_name || (profileInfo as any).fullName || '',
        profilePicUrl: (profileInfo as any).profile_pic_url || (profileInfo as any).profilePicUrl || '',
        followers: profileInfo.followers || 0,
        following: profileInfo.following || 0,
        posts: profileInfo.posts || 0,
        isVerified: (profileInfo as any).is_verified || (profileInfo as any).isVerified || false,
        isPrivate: (profileInfo as any).raw_data?.isPrivate || (profileInfo as any).isPrivate || false,
        hasContactDetails: (profileInfo as any).has_contact_details || (profileInfo as any).hasContactDetails || false,
        biography: (profileInfo as any).biography || (profileInfo as any).bio || '',
        externalUrl: (profileInfo as any).external_url || (profileInfo as any).externalUrl || '',
        category: (profileInfo as any).category || '',
        engagementRate: (profileInfo as any).engagement_rate || (profileInfo as any).engagementRate || 0,
        avgLikes: (profileInfo as any).avg_likes || (profileInfo as any).avgLikes || 0,
        avgViews: (profileInfo as any).avg_views || (profileInfo as any).avgViews || 0,
        platform: creator.platform,
        recentPosts: feedData.status === 'fulfilled' ? feedData.value.posts : [],
        collaborations: [], // We can implement this later with collaboration API
        audienceInsights: (profileInfo as any).raw_data?.audienceInsights || (profileInfo as any).audienceInsights || null
      };

      // Add reels to recent posts for Instagram
      if (creator.platform === 'instagram' && reelsData.status === 'fulfilled') {
        const reels = reelsData.value.posts.map(post => ({
          ...post,
          isReel: true
        }));
        combinedProfile.recentPosts = [
          ...(combinedProfile.recentPosts || []),
          ...reels
        ];
      }

      setProfileData(combinedProfile);

    } catch (err: any) {
      console.error('Failed to load creator profile:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserInfo, fetchUserFeed, fetchUserReels, getCreatorDetails]);

  const closeProfile = useCallback(() => {
    setIsOpen(false);
    setProfileData(null);
    setError(null);
  }, []);

  return {
    profileData,
    isLoading,
    error,
    isOpen,
    openProfile,
    closeProfile
  };
};
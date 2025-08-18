import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RawUserInfo {
  userId: string;
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  isPrivate: boolean;
  externalUrl?: string;
  category?: string;
}

interface RawPost {
  id: string;
  shortcode: string;
  caption: string;
  mediaType: 'photo' | 'video' | 'carousel';
  mediaUrl: string;
  likes: number;
  comments: number;
  timestamp: string;
  location?: string;
}

interface RawFeedData {
  posts: RawPost[];
  hasMore: boolean;
  nextCursor?: string;
}

export const useModashRaw = () => {
  const [lastUserInfo, setLastUserInfo] = useState<RawUserInfo | null>(null);
  const [lastUserFeed, setLastUserFeed] = useState<RawFeedData | null>(null);

  const fetchUserInfo = async (username: string, platform: string = 'instagram'): Promise<RawUserInfo> => {
    console.log('Fetching RAW user info for:', username, platform);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform,
        feedType: platform === 'instagram' ? 'user-info' : 'channel-info',
        identifier: username
      }
    });

    if (error) {
      console.error('RAW user info error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No user info data received');
    }

    const userInfo: RawUserInfo = {
      userId: data.userId || data.id,
      username: data.username,
      fullName: data.fullName || data.title,
      biography: data.biography || data.description || '',
      profilePicUrl: data.profilePicUrl || data.thumbnails?.default?.url,
      followers: data.followers || data.subscriberCount || 0,
      following: data.following || 0,
      posts: data.posts || data.videoCount || 0,
      isVerified: data.isVerified || false,
      isPrivate: data.isPrivate || false,
      externalUrl: data.externalUrl,
      category: data.category
    };

    setLastUserInfo(userInfo);
    return userInfo;
  };

  const fetchUserFeed = async (username: string, platform: string = 'instagram', limit: number = 12): Promise<RawFeedData> => {
    console.log('Fetching RAW user feed for:', username, platform);
    
    const feedType = platform === 'instagram' ? 'user-feed' : 
                     platform === 'tiktok' ? 'user-feed' : 
                     'uploaded-videos';
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform,
        feedType,
        identifier: username,
        limit
      }
    });

    if (error) {
      console.error('RAW user feed error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No feed data received');
    }

    const posts: RawPost[] = (data.posts || data.videos || []).map((item: any) => ({
      id: item.id || item.shortcode,
      shortcode: item.shortcode || item.id,
      caption: item.caption || item.title || '',
      mediaType: item.mediaType || (item.isVideo ? 'video' : 'photo'),
      mediaUrl: item.mediaUrl || item.thumbnailUrl || item.url,
      likes: item.likes || item.likeCount || 0,
      comments: item.comments || item.commentCount || 0,
      timestamp: item.timestamp || item.publishedAt,
      location: item.location
    }));

    const feedData: RawFeedData = {
      posts,
      hasMore: data.hasMore || false,
      nextCursor: data.nextCursor
    };

    setLastUserFeed(feedData);
    return feedData;
  };

  // Query hooks for user info
  const useUserInfo = (username: string, platform: string = 'instagram', enabled: boolean = true) => {
    return useQuery({
      queryKey: ['modash-raw-user-info', username, platform],
      queryFn: () => fetchUserInfo(username, platform),
      enabled: enabled && !!username,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    });
  };

  // Query hooks for user feed
  const useUserFeed = (username: string, platform: string = 'instagram', enabled: boolean = true, limit: number = 12) => {
    return useQuery({
      queryKey: ['modash-raw-user-feed', username, platform, limit],
      queryFn: () => fetchUserFeed(username, platform, limit),
      enabled: enabled && !!username,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 2
    });
  };

  return {
    fetchUserInfo,
    fetchUserFeed,
    useUserInfo,
    useUserFeed,
    lastUserInfo,
    lastUserFeed
  };
};
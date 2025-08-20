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
  viewCount?: number;
  playCount?: number;
}

interface RawFeedData {
  posts: RawPost[];
  hasMore: boolean;
  nextCursor?: string;
}

interface RawMediaInfo {
  id: string;
  shortcode: string;
  caption: string;
  mediaType: 'photo' | 'video' | 'carousel';
  mediaUrl: string;
  likes: number;
  comments: number;
  views?: number;
  timestamp: string;
  location?: string;
  owner: {
    userId: string;
    username: string;
    fullName: string;
    profilePicUrl: string;
    isVerified: boolean;
  };
}

interface RawComment {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
  owner: {
    userId: string;
    username: string;
    profilePicUrl: string;
    isVerified: boolean;
  };
  hasReplies?: boolean;
  replyCount?: number;
}

interface RawCommentsData {
  comments: RawComment[];
  hasMore: boolean;
  nextCursor?: string;
}

interface RawSearchResult {
  users: Array<{
    userId: string;
    username: string;
    fullName: string;
    profilePicUrl: string;
    isVerified: boolean;
    followers: number;
  }>;
  hashtags: Array<{
    name: string;
    postCount: number;
  }>;
}

interface RawAudioInfo {
  audioId: string;
  title: string;
  artist: string;
  duration: number;
  posts: RawPost[];
  hasMore: boolean;
  nextCursor?: string;
}

export const useModashRaw = () => {
  const [lastUserInfo, setLastUserInfo] = useState<RawUserInfo | null>(null);
  const [lastUserFeed, setLastUserFeed] = useState<RawFeedData | null>(null);

  // Instagram Search
  const fetchInstagramSearch = async (query: string, limit: number = 20): Promise<RawSearchResult> => {
    console.log('Searching Instagram for:', query);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'search',
        query,
        limit
      }
    });

    if (error) {
      console.error('API search error:', error);
      // Extract the actual error message from the edge function response
      const errorMessage = error.message || 'Unknown error occurred';
      if (errorMessage.includes('insufficient_credits') || errorMessage.includes('not enough credits')) {
        throw new Error('Insufficient credits for Modash API access. Please upgrade your plan.');
      }
      throw new Error(errorMessage);
    }
    if (!data) throw new Error('No search data received');

    return data as RawSearchResult;
  };

  // Instagram User Info
  const fetchUserInfo = async (username: string, platform: string = 'instagram'): Promise<RawUserInfo> => {
    console.log('Fetching RAW user info for:', username, platform);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform,
        feedType: platform === 'instagram' ? 'user-info' : 'channel-info',
        identifier: username
      }
    });

    if (error) throw error;
    if (!data) throw new Error('No user info data received');

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

  // Instagram User Feed
  const fetchUserFeed = async (username: string, platform: string = 'instagram', limit: number = 12, cursor?: string): Promise<RawFeedData> => {
    console.log('Fetching RAW user feed for:', username, platform);
    
    const feedType = platform === 'instagram' ? 'user-feed' : 
                     platform === 'tiktok' ? 'user-feed' : 
                     'uploaded-videos';
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform,
        feedType,
        identifier: username,
        limit,
        cursor
      }
    });

    if (error) throw error;
    if (!data) throw new Error('No feed data received');

    const posts: RawPost[] = (data.posts || data.videos || []).map((item: any) => ({
      id: item.id || item.shortcode,
      shortcode: item.shortcode || item.id,
      caption: item.caption || item.title || '',
      mediaType: item.mediaType || (item.isVideo ? 'video' : 'photo'),
      mediaUrl: item.mediaUrl || item.thumbnailUrl || item.url,
      likes: item.likes || item.likeCount || 0,
      comments: item.comments || item.commentCount || 0,
      timestamp: item.timestamp || item.publishedAt,
      location: item.location,
      viewCount: item.viewCount || item.views,
      playCount: item.playCount
    }));

    const feedData: RawFeedData = {
      posts,
      hasMore: data.hasMore || false,
      nextCursor: data.nextCursor
    };

    setLastUserFeed(feedData);
    return feedData;
  };

  // Instagram User Reels
  const fetchUserReels = async (username: string, limit: number = 12, cursor?: string): Promise<RawFeedData> => {
    console.log('Fetching Instagram reels for:', username);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'user-reels',
        identifier: username,
        limit,
        cursor
      }
    });

    if (error) throw error;
    return data as RawFeedData;
  };

  // Instagram User Tags Feed
  const fetchUserTagsFeed = async (username: string, limit: number = 12, cursor?: string): Promise<RawFeedData> => {
    console.log('Fetching Instagram tags feed for:', username);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'user-tags-feed',
        identifier: username,
        limit,
        cursor
      }
    });

    if (error) throw error;
    return data as RawFeedData;
  };

  // Instagram Hashtag Feed
  const fetchHashtagFeed = async (hashtag: string, limit: number = 12, cursor?: string): Promise<RawFeedData> => {
    console.log('Fetching Instagram hashtag feed for:', hashtag);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'hashtag-feed',
        identifier: hashtag,
        limit,
        cursor
      }
    });

    if (error) throw error;
    return data as RawFeedData;
  };

  // Instagram Media Info
  const fetchMediaInfo = async (shortcode: string): Promise<RawMediaInfo> => {
    console.log('Fetching Instagram media info for:', shortcode);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'media-info',
        identifier: shortcode
      }
    });

    if (error) throw error;
    return data as RawMediaInfo;
  };

  // Instagram Media Comments
  const fetchMediaComments = async (shortcode: string, limit: number = 20, cursor?: string): Promise<RawCommentsData> => {
    console.log('Fetching Instagram media comments for:', shortcode);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'media-comments',
        identifier: shortcode,
        limit,
        cursor
      }
    });

    if (error) throw error;
    return data as RawCommentsData;
  };

  // Instagram Comment Replies
  const fetchCommentReplies = async (commentId: string, limit: number = 20, cursor?: string): Promise<RawCommentsData> => {
    console.log('Fetching Instagram comment replies for:', commentId);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'media-comment-replies',
        commentId,
        limit,
        cursor
      }
    });

    if (error) throw error;
    return data as RawCommentsData;
  };

  // Instagram Audio Info
  const fetchAudioInfo = async (audioId: string, limit: number = 20, cursor?: string): Promise<RawAudioInfo> => {
    console.log('Fetching Instagram audio info for:', audioId);
    
    const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
      body: {
        platform: 'instagram',
        feedType: 'audio-info',
        identifier: audioId,
        limit,
        cursor
      }
    });

    if (error) throw error;
    return data as RawAudioInfo;
  };

  // Query hooks for Instagram Search
  const useInstagramSearch = (query: string, limit: number = 20, enabled: boolean = true) => {
    return useQuery({
      queryKey: ['modash-raw-instagram-search', query, limit],
      queryFn: () => fetchInstagramSearch(query, limit),
      enabled: enabled && !!query && query.length >= 2,
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 2
    });
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
  const useUserFeed = (username: string, platform: string = 'instagram', enabled: boolean = true, limit: number = 12, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-user-feed', username, platform, limit, cursor],
      queryFn: () => fetchUserFeed(username, platform, limit, cursor),
      enabled: enabled && !!username,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 2
    });
  };

  // Query hooks for user reels
  const useUserReels = (username: string, enabled: boolean = true, limit: number = 12, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-user-reels', username, limit, cursor],
      queryFn: () => fetchUserReels(username, limit, cursor),
      enabled: enabled && !!username,
      staleTime: 2 * 60 * 1000,
      retry: 2
    });
  };

  // Query hooks for user tags feed
  const useUserTagsFeed = (username: string, enabled: boolean = true, limit: number = 12, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-user-tags-feed', username, limit, cursor],
      queryFn: () => fetchUserTagsFeed(username, limit, cursor),
      enabled: enabled && !!username,
      staleTime: 2 * 60 * 1000,
      retry: 2
    });
  };

  // Query hooks for hashtag feed
  const useHashtagFeed = (hashtag: string, enabled: boolean = true, limit: number = 12, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-hashtag-feed', hashtag, limit, cursor],
      queryFn: () => fetchHashtagFeed(hashtag, limit, cursor),
      enabled: enabled && !!hashtag,
      staleTime: 5 * 60 * 1000,
      retry: 2
    });
  };

  // Query hooks for media info
  const useMediaInfo = (shortcode: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: ['modash-raw-media-info', shortcode],
      queryFn: () => fetchMediaInfo(shortcode),
      enabled: enabled && !!shortcode,
      staleTime: 10 * 60 * 1000,
      retry: 2
    });
  };

  // Query hooks for media comments
  const useMediaComments = (shortcode: string, enabled: boolean = true, limit: number = 20, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-media-comments', shortcode, limit, cursor],
      queryFn: () => fetchMediaComments(shortcode, limit, cursor),
      enabled: enabled && !!shortcode,
      staleTime: 5 * 60 * 1000,
      retry: 2
    });
  };

  // Query hooks for comment replies
  const useCommentReplies = (commentId: string, enabled: boolean = true, limit: number = 20, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-comment-replies', commentId, limit, cursor],
      queryFn: () => fetchCommentReplies(commentId, limit, cursor),
      enabled: enabled && !!commentId,
      staleTime: 5 * 60 * 1000,
      retry: 2
    });
  };

  // Query hooks for audio info
  const useAudioInfo = (audioId: string, enabled: boolean = true, limit: number = 20, cursor?: string) => {
    return useQuery({
      queryKey: ['modash-raw-audio-info', audioId, limit, cursor],
      queryFn: () => fetchAudioInfo(audioId, limit, cursor),
      enabled: enabled && !!audioId,
      staleTime: 10 * 60 * 1000,
      retry: 2
    });
  };

  return {
    // Fetch functions
    fetchInstagramSearch,
    fetchUserInfo,
    fetchUserFeed,
    fetchUserReels,
    fetchUserTagsFeed,
    fetchHashtagFeed,
    fetchMediaInfo,
    fetchMediaComments,
    fetchCommentReplies,
    fetchAudioInfo,
    
    // React Query hooks
    useInstagramSearch,
    useUserInfo,
    useUserFeed,
    useUserReels,
    useUserTagsFeed,
    useHashtagFeed,
    useMediaInfo,
    useMediaComments,
    useCommentReplies,
    useAudioInfo,
    
    // State
    lastUserInfo,
    lastUserFeed
  };
};
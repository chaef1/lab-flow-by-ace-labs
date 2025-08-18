import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorReport {
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgViews: number;
  avgComments: number;
  isVerified: boolean;
  location: string;
  bio: string;
  postsPerWeek: number;
  vettingScore: {
    score: number;
    reasons: string[];
  };
  audience?: {
    countries: Array<{ name: string; percentage: number }>;
    ageGroups: Array<{ range: string; percentage: number }>;
    gender: { male: number; female: number };
  };
  growthHistory?: Array<{
    date: string;
    followers: number;
    engagementRate: number;
  }>;
}

export const useCreatorReport = (platform: string, userId: string) => {
  return useQuery({
    queryKey: ['creator-report', platform, userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-creator-report', {
        body: { platform, userId }
      });
      if (error) throw error;
      return data as CreatorReport;
    },
    enabled: !!(platform && userId),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCreatorPerformance = (platform: string, userId: string) => {
  return useQuery({
    queryKey: ['creator-performance', platform, userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-performance-data', {
        body: { platform, userId, period: 30, postCount: 12 }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(platform && userId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useCreatorCollaborations = (platform: string, userId: string) => {
  return useQuery({
    queryKey: ['creator-collaborations', platform, userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-collaborations', {
        body: { platform, userId, period: 90 }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(platform && userId),
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const useCreatorPosts = (platform: string, username: string) => {
  return useQuery({
    queryKey: ['creator-posts', platform, username],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
        body: { 
          platform, 
          feedType: 'user-feed', 
          identifier: username,
          limit: 12 
        }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(platform && username),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};
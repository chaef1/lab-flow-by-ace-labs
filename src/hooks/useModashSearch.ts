import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  influencer?: {
    followers?: { min: number; max: number };
    engagementRate?: { min: number; max: number };
    isVerified?: boolean;
    hasContactDetails?: boolean;
    keywords?: string;
    hashtags?: string[];
    interests?: string[];
    brands?: string[];
    location?: {
      countries?: string[];
    };
    language?: string[];
    gender?: string[];
  };
}

export interface SearchResult {
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgViews: number;
  isVerified: boolean;
  hasContactDetails: boolean;
  topAudience?: {
    country: string;
    city: string;
  };
  platform: string;
}

export const useModashSearch = () => {
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState({ field: 'followers', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(0);

  const searchQuery = useQuery({
    queryKey: ['modash-search', platform, filters, sort, currentPage],
    queryFn: async () => {
      console.log('Making Modash search request:', { platform, filters, sort, currentPage });
      
      const { data, error } = await supabase.functions.invoke('modash-discovery-search', {
        body: {
          platform,
          filters,
          sort: {
            field: sort.field,
            direction: sort.direction
          },
          pagination: { page: currentPage }
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to search creators');
      }
      
      console.log('Search response:', data);
      return data;
    },
    enabled: Object.keys(filters).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.error('Search attempt failed:', error);
      return failureCount < 2; // Retry up to 2 times
    }
  });

  const search = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const nextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const changePlatform = (newPlatform: 'instagram' | 'tiktok' | 'youtube') => {
    setPlatform(newPlatform);
    setCurrentPage(0);
  };

  const changeSort = (field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
    setCurrentPage(0);
  };

  return {
    platform,
    filters,
    sort,
    currentPage,
    results: searchQuery.data?.results || [],
    totalResults: searchQuery.data?.total || 0,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    search,
    nextPage,
    prevPage,
    changePlatform,
    changeSort,
    refetch: searchQuery.refetch
  };
};
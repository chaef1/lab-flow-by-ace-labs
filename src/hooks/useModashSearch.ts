import { useState, useCallback } from 'react';
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
      cities?: string[];
    };
    language?: string[];
    gender?: string[];
    ageRange?: string[];
    contentThemes?: string[];
    accountType?: string;
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
  const [filters, setFilters] = useState<SearchFilters>({
    // Default filters for initial load
    influencer: {
      followers: { min: 10000, max: 10000000 },
      engagementRate: { min: 0.01, max: 0.15 }
    }
  });
  const [sort, setSort] = useState({ field: 'followers', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const searchQuery = useQuery({
    queryKey: ['modash-search', platform, filters, sort, currentPage],
    queryFn: async () => {
      const keyword = filters.influencer?.keywords?.trim();
      const useDatabase = !!keyword && !keyword.startsWith('#');
      console.log('Search request:', { platform, filters, sort, currentPage, useDatabase });

      let data: any, error: any;
      if (useDatabase) {
        ({ data, error } = await supabase.functions.invoke('creators-search', {
          body: {
            platform,
            query: keyword,
            pagination: { page: currentPage }
          }
        }));
      } else {
        ({ data, error } = await supabase.functions.invoke('modash-discovery-search', {
          body: {
            platform,
            filters,
            sort: {
              field: sort.field,
              direction: sort.direction
            },
            pagination: { page: currentPage }
          }
        }));
      }
      
      if (error) {
        console.error('Search function error:', error);
        throw new Error(error.message || 'Failed to search creators');
      }
      
      console.log('Search response:', data);
      return data;
    },
    enabled: true, // Always enabled to show initial results
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.error('Search attempt failed:', error);
      return failureCount < 2; // Retry up to 2 times
    }
  });

  const searchSuggestionsForText = useCallback(async (searchText: string): Promise<SearchResult[]> => {
    if (!searchText || searchText.trim().length < 3) {
      return [];
    }

    setIsLoadingSuggestions(true);
    
    try {
      // Check for recent rate limit errors
      const rateLimitKey = 'modash-rate-limit-until';
      const rateLimitUntil = localStorage.getItem(rateLimitKey);
      if (rateLimitUntil && Date.now() < parseInt(rateLimitUntil)) {
        console.log('Rate limited, skipping API call');
        return [];
      }

      const { data, error } = await supabase.functions.invoke('modash-text-search', {
        body: {
          platform,
          query: searchText,
          limit: 8
        }
      });
      
      if (error) {
        console.error('Text search error:', error);
        
        // If it's a rate limit error, store the time to avoid more calls for a while
        if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
          localStorage.setItem(rateLimitKey, (Date.now() + 60000).toString()); // Wait 1 minute
        }
        
        return [];
      }
      
      return data.suggestions || [];
    } catch (error) {
      console.error('Text search failed:', error);
      return [];
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [platform]);

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
    setFilters,
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
    refetch: searchQuery.refetch,
    searchSuggestionsForText,
    searchSuggestions,
    setSearchSuggestions,
    isLoadingSuggestions
  };
};
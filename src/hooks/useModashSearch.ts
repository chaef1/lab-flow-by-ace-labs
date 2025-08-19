import { useState, useCallback, useRef } from 'react';
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
      const isUsernameSearch = keyword?.startsWith('@');
      const isHashtagSearch = keyword?.startsWith('#');
      const searchTerm = keyword?.replace(/^[@#]/, '') || '';
      
      console.log('Optimized search request:', { 
        platform, searchTerm, isUsernameSearch, isHashtagSearch, currentPage 
      });

      // Strategy 1: Direct username search - try social profile first
      if (isUsernameSearch && searchTerm) {
        console.log(`Direct username search for: @${searchTerm}`);
        
        // Try social profile API first for fresh data
        try {
          const { data: socialData, error: socialError } = await supabase.functions.invoke('social-profile', {
            body: { platform, username: searchTerm }
          });
          
          if (!socialError && socialData && socialData.username) {
            console.log('Found profile via social API');
            return {
              results: [{
                userId: socialData.userId || socialData.username,
                username: socialData.username,
                fullName: socialData.fullName || socialData.name || '',
                profilePicUrl: socialData.profilePicUrl || socialData.profile_picture_url || '',
                followers: socialData.followers || socialData.follower_count || 0,
                engagementRate: socialData.engagementRate || 0,
                avgLikes: socialData.avgLikes || 0,
                avgViews: socialData.avgViews || 0,
                isVerified: socialData.isVerified || false,
                hasContactDetails: false,
                topAudience: {},
                platform
              }],
              total: 1,
              page: currentPage,
              source: 'social-profile'
            };
          }
        } catch (socialError) {
          console.log('Social profile search failed, falling back to other methods');
        }
        
        // Fallback to database search for username
        try {
          const { data: dbData, error: dbError } = await supabase.functions.invoke('creators-search', {
            body: { platform, query: searchTerm, pagination: { page: currentPage } }
          });
          
          if (!dbError && dbData?.results?.length > 0) {
            console.log('Found profile in database');
            return { ...dbData, source: 'database' };
          }
        } catch (dbError) {
          console.log('Database search failed for username');
        }
        
        // Final fallback to Modash text search
        const { data: modashData, error: modashError } = await supabase.functions.invoke('modash-text-search', {
          body: { platform, query: searchTerm, limit: 15 }
        });
        
        if (!modashError && modashData?.suggestions?.length > 0) {
          return {
            results: modashData.suggestions.map((suggestion: any) => ({
              userId: suggestion.userId,
              username: suggestion.username,
              fullName: suggestion.fullName || '',
              profilePicUrl: suggestion.profilePicUrl || '',
              followers: suggestion.followers || 0,
              engagementRate: 0,
              avgLikes: 0,
              avgViews: 0,
              isVerified: suggestion.isVerified || false,
              hasContactDetails: false,
              topAudience: {},
              platform: suggestion.platform || platform
            })),
            total: modashData.suggestions.length,
            page: currentPage,
            source: 'modash-text'
          };
        }
      }
      
      // Strategy 2: Hashtag search - go direct to Modash discovery
      if (isHashtagSearch) {
        console.log(`Hashtag search for: #${searchTerm}`);
        const { data, error } = await supabase.functions.invoke('modash-discovery-search', {
          body: {
            platform,
            filters: {
              influencer: {
                ...filters.influencer,
                hashtags: [searchTerm]
              }
            },
            sort: { field: sort.field, direction: sort.direction },
            pagination: { page: currentPage }
          }
        });
        
        if (error) throw new Error(error.message || 'Hashtag search failed');
        return { ...data, source: 'modash-discovery' };
      }
      
      // Strategy 3: General text search - database first, then Modash
      if (searchTerm) {
        console.log(`General text search for: ${searchTerm}`);
        
        // Try database first
        const { data: dbData, error: dbError } = await supabase.functions.invoke('creators-search', {
          body: { platform, query: searchTerm, pagination: { page: currentPage } }
        });
        
        if (!dbError && dbData?.results?.length > 0) {
          console.log('Found results in database');
          return { ...dbData, source: 'database' };
        }
        
        // Fallback to Modash text search
        const { data: modashData, error: modashError } = await supabase.functions.invoke('modash-text-search', {
          body: { platform, query: searchTerm, limit: 15 }
        });
        
        if (!modashError && modashData?.suggestions?.length > 0) {
          return {
            results: modashData.suggestions.map((suggestion: any) => ({
              userId: suggestion.userId,
              username: suggestion.username,
              fullName: suggestion.fullName || '',
              profilePicUrl: suggestion.profilePicUrl || '',
              followers: suggestion.followers || 0,
              engagementRate: 0,
              avgLikes: 0,
              avgViews: 0,
              isVerified: suggestion.isVerified || false,
              hasContactDetails: false,
              topAudience: {},
              platform: suggestion.platform || platform
            })),
            total: modashData.suggestions.length,
            page: currentPage,
            source: 'modash-text'
          };
        }
      }
      
      // Strategy 4: Discovery search for general browsing (no specific search term)
      console.log('General discovery search');
      const { data, error } = await supabase.functions.invoke('modash-discovery-search', {
        body: {
          platform,
          filters,
          sort: { field: sort.field, direction: sort.direction },
          pagination: { page: currentPage }
        }
      });
      
      if (error) throw new Error(error.message || 'Discovery search failed');
      return { ...data, source: 'modash-discovery' };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes base stale time
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: (failureCount, error) => {
      console.error('Search attempt failed:', error);
      return failureCount < 2;
    },
    meta: {
      // Add source tracking for better cache management
      source: 'dynamic'
    }
  });

  // Request cache to prevent duplicate calls
  const requestCache = useRef<Map<string, Promise<SearchResult[]>>>(new Map());
  const lastRequestTime = useRef<Map<string, number>>(new Map());

  const searchSuggestionsForText = useCallback(async (searchText: string): Promise<SearchResult[]> => {
    if (!searchText || searchText.trim().length < 3) {
      return [];
    }

    const cleanSearch = searchText.trim().toLowerCase();
    const cacheKey = `${platform}-${cleanSearch}`;
    const isUsernameSearch = searchText.startsWith('@');
    
    // Rate limiting check
    const rateLimitKey = 'modash-rate-limit-until';
    const rateLimitUntil = localStorage.getItem(rateLimitKey);
    if (rateLimitUntil && Date.now() < parseInt(rateLimitUntil)) {
      console.log('Rate limited, skipping suggestions');
      return [];
    }

    // Debounce rapid requests (prevent multiple calls within 300ms)
    const lastTime = lastRequestTime.current.get(cacheKey) || 0;
    if (Date.now() - lastTime < 300) {
      console.log('Debounced suggestion request');
      return [];
    }
    
    // Return existing promise if request is already in flight
    if (requestCache.current.has(cacheKey)) {
      console.log('Returning cached promise for suggestion');
      return requestCache.current.get(cacheKey)!;
    }

    setIsLoadingSuggestions(true);
    lastRequestTime.current.set(cacheKey, Date.now());
    
    const searchPromise = (async (): Promise<SearchResult[]> => {
      try {
        // For @username searches, try social profile first for real-time data
        if (isUsernameSearch) {
          const username = cleanSearch.substring(1);
          console.log(`Fetching suggestions for @${username} via social profile`);
          
          try {
            const { data: socialData, error: socialError } = await supabase.functions.invoke('social-profile', {
              body: { platform, username }
            });
            
            if (!socialError && socialData?.username) {
              const result: SearchResult[] = [{
                userId: socialData.userId || socialData.username,
                username: socialData.username,
                fullName: socialData.fullName || socialData.name || '',
                profilePicUrl: socialData.profilePicUrl || socialData.profile_picture_url || '',
                followers: socialData.followers || socialData.follower_count || 0,
                engagementRate: socialData.engagementRate || 0,
                avgLikes: socialData.avgLikes || 0,
                avgViews: socialData.avgViews || 0,
                isVerified: socialData.isVerified || false,
                hasContactDetails: false,
                topAudience: { country: '', city: '' },
                platform
              }];
              return result;
            }
          } catch (error) {
            console.log('Social profile suggestion failed, falling back to text search');
          }
        }
        
        // Fallback to Modash text search
        const { data, error } = await supabase.functions.invoke('modash-text-search', {
          body: {
            platform,
            query: isUsernameSearch ? cleanSearch.substring(1) : cleanSearch,
            limit: 8
          }
        });
        
        if (error) {
          console.error('Text search error:', error);
          
          if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
            localStorage.setItem(rateLimitKey, (Date.now() + 60000).toString());
          }
          
          return [];
        }
        
        return (data.suggestions || []).map((suggestion: any) => ({
          userId: suggestion.userId,
          username: suggestion.username,
          fullName: suggestion.fullName || '',
          profilePicUrl: suggestion.profilePicUrl || '',
          followers: suggestion.followers || 0,
          engagementRate: 0,
          avgLikes: 0,
          avgViews: 0,
          isVerified: suggestion.isVerified || false,
          hasContactDetails: false,
          topAudience: { country: '', city: '' },
          platform: suggestion.platform || platform
        }));
      } catch (error) {
        console.error('Suggestion search failed:', error);
        return [];
      } finally {
        setIsLoadingSuggestions(false);
        requestCache.current.delete(cacheKey);
      }
    })();

    requestCache.current.set(cacheKey, searchPromise);
    return searchPromise;
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
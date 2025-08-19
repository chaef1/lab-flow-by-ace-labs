import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modashClient, ModashSearchPayload, ModashCreator } from '@/lib/modash-client';
import { supabase } from '@/integrations/supabase/client';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface DiscoveryFilters {
  followers?: { min: number; max: number };
  engagementRate?: { min: number; max: number };
  location?: Array<{ id: string; name: string }>;
  language?: string[];
  interests?: Array<{ id: string | number; name: string }>;
  hashtags?: string[];
  keywords?: string;
  audience?: {
    age?: Array<{ from: number; to: number; weight: number }>;
    gender?: { female?: number; male?: number };
  };
  isVerified?: boolean;
  hasContactDetails?: boolean;
  contentThemes?: string[];
}

export interface SearchState {
  results: ModashCreator[];
  total: number;
  page: number;
  isLoading: boolean;
  error: string | null;
}

export const useModashDiscovery = () => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [filters, setFilters] = useState<DiscoveryFilters>({
    followers: { min: 10000, max: 10000000 },
    engagementRate: { min: 0.01, max: 0.15 }
  });
  const [sort, setSort] = useState({ field: 'followers', direction: 'desc' as 'asc' | 'desc' });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Main search query
  const searchQuery = useQuery({
    queryKey: ['modash-discovery', platform, filters, sort, currentPage, searchKeyword],
    queryFn: async () => {
      const payload: ModashSearchPayload = {
        page: currentPage,
        limit: 15,
        sort,
        filter: {
          ...filters,
          keywords: searchKeyword || undefined,
        }
      };

      switch (platform) {
        case 'instagram':
          return modashClient.searchInstagram(payload);
        case 'tiktok':
          return modashClient.searchTikTok(payload);
        case 'youtube':
          return modashClient.searchYouTube(payload);
        default:
          throw new Error('Invalid platform');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: true,
  });

  // Dictionary queries with caching
  const useDict = (kind: 'location' | 'interest' | 'brand' | 'language', query = '') => {
    return useQuery({
      queryKey: ['modash-dictionary', kind, query, platform],
      queryFn: async () => {
        switch (kind) {
          case 'interest':
            return modashClient.getInterests(platform, query);
          case 'location':
            return modashClient.getLocations(platform, query);
          case 'brand':
            return modashClient.getBrands(platform, query);
          case 'language':
            return modashClient.getLanguages(platform, query);
        }
      },
      enabled: query.length >= 2,
      staleTime: 10 * 60 * 1000, // 10 minutes for dictionaries
    });
  };

  // Text search for suggestions
  const [suggestions, setSuggestions] = useState<ModashCreator[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const searchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const results = await modashClient.searchText(platform, query.trim(), 8);
      setSuggestions(results);
    } catch (error) {
      console.error('Suggestion search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [platform]);

  // Watchlist management
  const { data: watchlists, refetch: refetchWatchlists } = useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createWatchlistMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lists')
        .insert({ name, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchWatchlists();
    },
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ 
      watchlistId, 
      creator 
    }: { 
      watchlistId: string; 
      creator: ModashCreator;
    }) => {
      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: watchlistId,
          platform: creator.platform,
          user_id: creator.userId,
          username: creator.username,
          snapshot_json: creator as any,
        });
      if (error) throw error;
      return data;
    },
  });

  // Utility functions
  const changePlatform = useCallback((newPlatform: Platform) => {
    setPlatform(newPlatform);
    setCurrentPage(0);
    setSuggestions([]);
  }, []);

  const updateFilters = useCallback((newFilters: DiscoveryFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  }, []);

  const updateSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
    setCurrentPage(0);
  }, []);

  const nextPage = useCallback(() => {
    if (searchQuery.data?.results.length === 15) {
      setCurrentPage(prev => prev + 1);
    }
  }, [searchQuery.data?.results.length]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const resetSearch = useCallback(() => {
    setSearchKeyword('');
    setFilters({
      followers: { min: 10000, max: 10000000 },
      engagementRate: { min: 0.01, max: 0.15 }
    });
    setCurrentPage(0);
    setSuggestions([]);
  }, []);

  return {
    // Platform state
    platform,
    changePlatform,
    
    // Search state
    searchKeyword,
    setSearchKeyword,
    filters,
    updateFilters,
    sort,
    updateSort,
    currentPage,
    
    // Results
    results: searchQuery.data?.results || [],
    totalResults: searchQuery.data?.total || 0,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    refetch: searchQuery.refetch,
    
    // Suggestions
    suggestions,
    isLoadingSuggestions,
    searchSuggestions,
    
    // Pagination
    nextPage,
    prevPage,
    canGoNext: (searchQuery.data?.results.length || 0) >= 15,
    canGoPrev: currentPage > 0,
    
    // Dictionary hook
    useDict,
    
    // Watchlists
    watchlists,
    lists: watchlists,
    createWatchlist: createWatchlistMutation.mutate,
    createList: createWatchlistMutation.mutate,
    addToWatchlist: addToWatchlistMutation.mutate,
    addToList: addToWatchlistMutation.mutate,
    isCreatingWatchlist: createWatchlistMutation.isPending,
    isCreatingList: createWatchlistMutation.isPending,
    isAddingToWatchlist: addToWatchlistMutation.isPending,
    isAddingToList: addToWatchlistMutation.isPending,
    
    // Legacy compatibility
    useDictionary: useDict,
    
    // Utilities
    resetSearch,
  };
};
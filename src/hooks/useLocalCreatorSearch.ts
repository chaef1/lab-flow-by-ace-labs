import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModashRaw } from './useModashRaw';
import { useToast } from './use-toast';

export interface LocalCreator {
  id: string;
  platform: string;
  user_id: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
  avg_likes: number;
  avg_views: number;
  is_verified: boolean;
  has_contact_details: boolean;
  top_audience_country?: string;
  top_audience_city?: string;
  biography?: string;
  external_url?: string;
  category?: string;
  raw_data: any;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

interface SearchFilters {
  followers?: { min: number; max: number };
  engagementRate?: { min: number; max: number };
  isVerified?: boolean;
  hasContactDetails?: boolean;
}

interface SearchResult {
  results: LocalCreator[];
  total: number;
  fromDatabase: boolean;
  rateLimited?: boolean;
  error?: string;
}

export const useLocalCreatorSearch = () => {
  const queryClient = useQueryClient();
  const { fetchInstagramSearch, fetchUserInfo } = useModashRaw();
  const { toast } = useToast();

  // Search local database first
  const searchLocalDatabase = async (
    platform: string, 
    query?: string, 
    filters?: SearchFilters,
    limit: number = 15,
    offset: number = 0
  ): Promise<SearchResult> => {
    console.log('Searching local database for:', query, platform);

    let supabaseQuery = supabase
      .from('creators')
      .select('*', { count: 'exact' })
      .eq('platform', platform);

    // Apply text search if query provided
    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      
      // Search in multiple fields
      supabaseQuery = supabaseQuery.or(
        `username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,biography.ilike.%${searchTerm}%`
      );
    }

    // Apply filters
    if (filters?.followers) {
      supabaseQuery = supabaseQuery
        .gte('followers', filters.followers.min)
        .lte('followers', filters.followers.max);
    }

    if (filters?.engagementRate) {
      supabaseQuery = supabaseQuery
        .gte('engagement_rate', filters.engagementRate.min)
        .lte('engagement_rate', filters.engagementRate.max);
    }

    if (filters?.isVerified !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_verified', filters.isVerified);
    }

    if (filters?.hasContactDetails !== undefined) {
      supabaseQuery = supabaseQuery.eq('has_contact_details', filters.hasContactDetails);
    }

    // Apply pagination and ordering
    supabaseQuery = supabaseQuery
      .order('followers', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Local database search error:', error);
      return { results: [], total: 0, fromDatabase: true, error: error.message };
    }

    return {
      results: data || [],
      total: count || 0,
      fromDatabase: true
    };
  };

  // Store creator to database
  const storeCreatorToDatabase = async (creator: any, platform: string): Promise<LocalCreator | null> => {
    try {
      const creatorData = {
        platform,
        user_id: creator.userId || creator.user_id,
        username: creator.username,
        full_name: creator.fullName || creator.full_name,
        profile_pic_url: creator.profilePicUrl || creator.profile_pic_url,
        followers: creator.followers || 0,
        following: creator.following || 0,
        posts: creator.posts || 0,
        engagement_rate: creator.engagementRate || creator.engagement_rate || 0,
        avg_likes: creator.avgLikes || creator.avg_likes || 0,
        avg_views: creator.avgViews || creator.avg_views || 0,
        is_verified: creator.isVerified || creator.is_verified || false,
        has_contact_details: creator.hasContactDetails || creator.has_contact_details || false,
        top_audience_country: creator.topAudienceCountry || creator.top_audience_country,
        top_audience_city: creator.topAudienceCity || creator.top_audience_city,
        biography: creator.biography || creator.bio,
        external_url: creator.externalUrl || creator.external_url,
        category: creator.category,
        raw_data: creator,
        last_updated: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('creators')
        .upsert(creatorData, { 
          onConflict: 'platform,user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing creator to database:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in storeCreatorToDatabase:', error);
      return null;
    }
  };

  // Search API and store results
  const searchApiAndStore = async (
    platform: string,
    query: string,
    limit: number = 15
  ): Promise<SearchResult> => {
    try {
      console.log('Searching API for:', query, platform);

      // Use RAW API for search
      const apiResult = await fetchInstagramSearch(query, limit);
      
      if (!apiResult.users || apiResult.users.length === 0) {
        return {
          results: [],
          total: 0,
          fromDatabase: false
        };
      }

      // Store each result to database
      const storedCreators: LocalCreator[] = [];
      
      for (const user of apiResult.users) {
        // Get detailed info for each user
        try {
          const detailedInfo = await fetchUserInfo(user.username, platform);
          const stored = await storeCreatorToDatabase(detailedInfo, platform);
          if (stored) {
            storedCreators.push(stored);
          }
        } catch (userError) {
          console.error('Error fetching detailed user info:', userError);
          // Store basic info if detailed fetch fails
          const stored = await storeCreatorToDatabase(user, platform);
          if (stored) {
            storedCreators.push(stored);
          }
        }
      }

      return {
        results: storedCreators,
        total: storedCreators.length,
        fromDatabase: false
      };

    } catch (error: any) {
      console.error('API search error:', error);
      
      // Check for rate limiting
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        return {
          results: [],
          total: 0,
          fromDatabase: false,
          rateLimited: true,
          error: 'API rate limit exceeded'
        };
      }

      return {
        results: [],
        total: 0,
        fromDatabase: false,
        error: error.message || 'API search failed'
      };
    }
  };

  // Combined search strategy: database first, then API
  const searchCreators = useMutation({
    mutationFn: async ({
      platform,
      query,
      filters,
      limit = 15,
      offset = 0,
      forceApi = false
    }: {
      platform: string;
      query?: string;
      filters?: SearchFilters;
      limit?: number;
      offset?: number;
      forceApi?: boolean;
    }) => {
      // If no query and no specific filters, search database
      if (!query?.trim() && !forceApi) {
        return await searchLocalDatabase(platform, query, filters, limit, offset);
      }

      // First try local database
      if (!forceApi) {
        const localResults = await searchLocalDatabase(platform, query, filters, limit, offset);
        
        // If we have good results from database, use them
        if (localResults.results.length >= Math.min(5, limit)) {
          return localResults;
        }
      }

      // If no/few local results and we have a search query, try API
      if (query?.trim()) {
        const apiResults = await searchApiAndStore(platform, query.trim(), limit);
        
        // If API failed but we have some local results, return local
        if (apiResults.error && !forceApi) {
          const localFallback = await searchLocalDatabase(platform, query, filters, limit, offset);
          if (localFallback.results.length > 0) {
            return {
              ...localFallback,
              error: `API failed: ${apiResults.error}. Showing local results.`
            };
          }
        }
        
        return apiResults;
      }

      // Default to local search
      return await searchLocalDatabase(platform, query, filters, limit, offset);
    },
    onError: (error: any) => {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to search creators',
        variant: 'destructive'
      });
    }
  });

  // Get creator details (with caching check)
  const getCreatorDetails = useCallback(async (username: string, platform: string = 'instagram') => {
    try {
      // First check if we have recent data in database
      const { data: existing } = await supabase
        .from('creators')
        .select('*')
        .eq('platform', platform)
        .eq('username', username)
        .gte('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours
        .single();

      if (existing) {
        console.log('Using cached creator details for:', username);
        return existing;
      }

      // Fetch fresh data from API
      console.log('Fetching fresh creator details for:', username);
      const apiData = await fetchUserInfo(username, platform);
      
      // Store to database
      const stored = await storeCreatorToDatabase(apiData, platform);
      return stored || apiData;

    } catch (error) {
      console.error('Error getting creator details:', error);
      throw error;
    }
  }, [fetchUserInfo]);

  return {
    searchCreators: searchCreators.mutate,
    isSearching: searchCreators.isPending,
    searchError: searchCreators.error,
    searchData: searchCreators.data,
    getCreatorDetails,
    storeCreatorToDatabase
  };
};
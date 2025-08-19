import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModashRaw } from './useModashRaw';
import { useToast } from './use-toast';

interface SearchResult {
  results: any[];
  total: number;
  rateLimited?: boolean;
  error?: string;
}

interface RateLimitAwareSearchProps {
  onResults: (results: SearchResult) => void;
  onSearching: (isSearching: boolean) => void;
}

export const useRateLimitAwareSearch = ({ 
  onResults, 
  onSearching 
}: RateLimitAwareSearchProps) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { fetchInstagramSearch } = useModashRaw();
  const { toast } = useToast();

  const discoverySearch = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('modash-discovery-search', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.rateLimited) {
        setIsRateLimited(true);
        // Fall back to raw search if keywords provided
        const keywords = data.searchKeywords || data.filters?.text || data.filters?.keywords;
        if (keywords) {
          handleRawSearchFallback(keywords);
        } else {
          onResults({
            results: [],
            total: 0,
            rateLimited: true,
            error: 'Rate limited and no keywords for fallback search'
          });
        }
      } else {
        setIsRateLimited(false);
        onResults(data);
      }
      onSearching(false);
    },
    onError: (error: any) => {
      console.error('Discovery search error:', error);
      
      // Check if it's a rate limit error
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        setIsRateLimited(true);
        toast({
          title: 'Rate Limited',
          description: 'Discovery API is rate limited. Trying alternative search...',
          variant: 'default',
        });
        
        // Try fallback if we have search keywords
        // This would need to be passed from the component
        onResults({
          results: [],
          total: 0,
          rateLimited: true,
          error: 'Rate limit exceeded'
        });
      } else {
        toast({
          title: 'Search Error',
          description: 'Failed to search creators. Please try again.',
          variant: 'destructive',
        });
      }
      
      onSearching(false);
    },
  });

  const handleRawSearchFallback = async (keywords: string) => {
    try {
      onSearching(true);
      console.log('Falling back to raw search for:', keywords);
      
      const rawResults = await fetchInstagramSearch(keywords, 20);
      
      // Transform raw results to match discovery format
      const transformedResults = rawResults.users.map(user => ({
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        profilePicUrl: user.profilePicUrl,
        followers: user.followers,
        engagementRate: 0, // Raw API doesn't provide this
        avgLikes: 0,
        avgViews: 0,
        isVerified: user.isVerified,
        hasContactDetails: false,
        topAudience: {},
        platform: 'instagram',
        matchInfo: { source: 'raw_api_fallback' }
      }));

      onResults({
        results: transformedResults,
        total: transformedResults.length,
        rateLimited: false
      });

      toast({
        title: 'Fallback Search Complete',
        description: `Found ${transformedResults.length} creators using alternative method`,
        variant: 'default',
      });
      
    } catch (fallbackError) {
      console.error('Raw search fallback failed:', fallbackError);
      toast({
        title: 'Search Failed',
        description: 'Both discovery and fallback search methods failed. Please try again later.',
        variant: 'destructive',
      });
      
      onResults({
        results: [],
        total: 0,
        rateLimited: true,
        error: 'All search methods failed'
      });
    } finally {
      onSearching(false);
    }
  };

  const executeSearch = (payload: any) => {
    setIsRateLimited(false);
    onSearching(true);
    
    // Add keywords to payload for potential fallback
    const searchPayload = {
      ...payload,
      searchKeywords: payload.filters?.influencer?.keywords?.[0] || payload.filters?.text || payload.searchKeyword || ''
    };
    
    discoverySearch.mutate(searchPayload);
  };

  const executeRawSearch = async (keywords: string) => {
    if (!keywords) return;
    
    setIsRateLimited(false);
    onSearching(true);
    
    try {
      await handleRawSearchFallback(keywords);
    } catch (error) {
      console.error('Raw search failed:', error);
      onSearching(false);
    }
  };

  return {
    executeSearch,
    executeRawSearch,
    isRateLimited
  };
};
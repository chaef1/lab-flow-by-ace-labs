import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter,
  RefreshCw,
  ArrowLeft,
  Instagram,
  Youtube,
  Music,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useModashDiscovery } from '@/hooks/useModashDiscovery';
import { useModashSearch, SearchResult } from '@/hooks/useModashSearch';
import { supabase } from '@/integrations/supabase/client';
import { CreatorCard } from '@/components/discovery/CreatorCard';
import { AdvancedFilters } from '@/components/discovery/AdvancedFilters';
import { SearchInput } from '@/components/discovery/SearchInput';
import { useToast } from '@/hooks/use-toast';
import { ToastErrorHandler } from '@/components/ui/toast-error-handler';
import { useSearchParams, Link } from 'react-router-dom';
import Dashboard from '@/components/layout/Dashboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const platformIcons = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
};

const Discovery = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchKeyword, setSearchKeyword } = useModashDiscovery();
  const { 
    platform, 
    results, 
    isLoading, 
    search, 
    changePlatform,
    nextPage,
    prevPage,
    currentPage,
    totalResults,
    filters,
    setFilters,
    searchSuggestionsForText,
    searchSuggestions,
    setSearchSuggestions,
    isLoadingSuggestions,
    error: searchQueryError
  } = useModashSearch();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initialize search from URL params
  React.useEffect(() => {
    const urlPlatform = searchParams.get('platform');
    const urlQuery = searchParams.get('q');
    
    if (urlPlatform && urlPlatform !== platform) {
      changePlatform(urlPlatform as any);
    }
    
    if (urlQuery && urlQuery !== searchKeyword) {
      setSearchKeyword(urlQuery);
    }
  }, [searchParams]);

  // Update URL when platform or search changes
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (platform !== 'instagram') params.set('platform', platform);
    if (searchKeyword) params.set('q', searchKeyword);
    setSearchParams(params);
  }, [platform, searchKeyword, setSearchParams]);

  // Load suggestions when search keyword changes with longer debounce and caching
  React.useEffect(() => {
    if (searchKeyword && searchKeyword.trim().length >= 3) {
      const debounceTimer = setTimeout(async () => {
        // Check cache first to reduce API calls
        const cacheKey = `${platform}-${searchKeyword.toLowerCase()}`;
        const cachedSuggestions = localStorage.getItem(`modash-suggestions-${cacheKey}`);
        const cacheTime = localStorage.getItem(`modash-suggestions-time-${cacheKey}`);
        
        // Use cached results if they're less than 5 minutes old
        if (cachedSuggestions && cacheTime && (Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000) {
          setSearchSuggestions(JSON.parse(cachedSuggestions));
          return;
        }

        const suggestions = await searchSuggestionsForText(searchKeyword);
        setSearchSuggestions(suggestions);
        
        // Cache successful results
        if (suggestions.length > 0) {
          localStorage.setItem(`modash-suggestions-${cacheKey}`, JSON.stringify(suggestions));
          localStorage.setItem(`modash-suggestions-time-${cacheKey}`, Date.now().toString());
        }
      }, 1000); // Increased debounce to 1 second

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchKeyword, platform]);

  const handleSearch = async () => {
    console.log('=== STARTING SEARCH ===');
    console.log('Search keyword:', searchKeyword);
    console.log('Platform:', platform);
    console.log('Filters:', filters);
    
    // Clear any previous errors
    setSearchError(null);
    
    const searchFilters = {
      influencer: {
        ...(searchKeyword.trim() && { keywords: searchKeyword }),
        ...filters.influencer
      }
    };
    
    console.log('Final search filters:', searchFilters);
    
    try {
      search(searchFilters);
    } catch (error: any) {
      setSearchError(error?.message || 'Search failed. Please try again.');
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSuggestionSelect = (suggestion: SearchResult) => {
    console.log('Selected suggestion:', suggestion);
    
    // Perform search with the selected creator as primary result
    const searchFilters = {
      influencer: {
        keywords: suggestion.username,
        // Remove restrictive filters for exact username matches
        followers: { min: 1, max: 1000000000 },
        engagementRate: { min: 0, max: 1 }
      }
    };
    
    search(searchFilters);
    setSearchSuggestions([]);
  };


  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const displayResults = React.useMemo(() => {
    if (!results?.length) return [] as any[];
    const q = searchKeyword?.trim().replace(/^@/, '').toLowerCase();
    if (!q) return results;
    const idx = results.findIndex(r => r.username?.toLowerCase() === q);
    if (idx <= 0) return results;
    const clone = [...results];
    const [match] = clone.splice(idx, 1);
    return [match, ...clone];
  }, [results, searchKeyword]);

  return (
    <Dashboard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discover Creators</h1>
            <p className="text-muted-foreground">
              Find and analyze creators across Instagram, TikTok, and YouTube
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
            Powered by Modash ⚡
          </Badge>
        </div>

        {/* Platform Tabs */}
        <Tabs value={platform} onValueChange={(value) => changePlatform(value as any)}>
          <TabsList>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              TikTok
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value={platform} className="space-y-6">
            {/* Search Controls */}
            <div className="flex gap-4">
              <SearchInput
                value={searchKeyword}
                onChange={setSearchKeyword}
                onSearch={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                suggestions={searchSuggestions}
                isLoadingSuggestions={isLoadingSuggestions}
                isSearching={isLoading}
                platform={platform}
                placeholder={`Search ${platform} creators by @username, keyword, or hashtag...`}
              />
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {totalResults > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {formatNumber(totalResults)} creators
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={results.length < 15}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Creator Cards */}
              {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayResults.map((creator, index) => (
                    <CreatorCard key={`${creator.userId}-${index}`} creator={creator} platform={platform} />
                  ))}
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-muted rounded-full" />
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24" />
                            <div className="h-3 bg-muted rounded w-16" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-8 bg-muted rounded" />
                          <div className="h-6 bg-muted rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchKeyword || (filters.influencer && Object.keys(filters.influencer).some(key => 
                key !== 'followers' && key !== 'engagementRate' && filters.influencer[key]
              )) ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No creators found matching your criteria</p>
                  <Button variant="outline" className="mt-4" onClick={() => {
                    setSearchKeyword('');
                    setFilters({
                      influencer: {
                        followers: { min: 10000, max: 10000000 },
                        engagementRate: { min: 0.01, max: 0.15 }
                      }
                    });
                  }}>
                    Clear Search
                  </Button>
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Filters Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            
            <AdvancedFilters
              platform={platform}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClose={() => setIsFilterOpen(false)}
            />
          </DialogContent>
        </Dialog>
        
        <ToastErrorHandler 
          error={searchError || searchQueryError?.message} 
          onClear={() => setSearchError(null)} 
        />
      </div>
    </Dashboard>
  );
};

export default Discovery;
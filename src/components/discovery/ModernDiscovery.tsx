import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, Plus, Download, Eye, Bookmark, Grid, List, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Platform } from '@/hooks/useModashDiscovery';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { useLocalCreatorSearch } from '@/hooks/useLocalCreatorSearch';
import { RateLimitNotice } from './RateLimitNotice';
import { ModernFilterRail } from './ModernFilterRail';
import { ModernCreatorCard } from './ModernCreatorCard';
import { ModernSearchInput } from './ModernSearchInput';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { CreatorProfileSheet } from './CreatorProfileSheet';
import { SearchModeToggle } from './SearchModeToggle';
import { formatNumber } from '@/lib/utils';

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const platforms: PlatformConfig[] = [
  { 
    id: 'instagram', 
    label: 'Instagram', 
    icon: <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500" />,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500' 
  },
  { 
    id: 'youtube', 
    label: 'YouTube', 
    icon: <div className="w-4 h-4 rounded bg-red-600" />,
    color: 'bg-gradient-to-br from-red-500 to-red-600' 
  },
  { 
    id: 'tiktok', 
    label: 'TikTok', 
    icon: <div className="w-4 h-4 rounded bg-black" />,
    color: 'bg-gradient-to-br from-black to-gray-800' 
  },
];

export const ModernDiscovery = () => {
  // State management
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState({
    followers: { min: 10000, max: 10000000 },
    engagementRate: { min: 0.01, max: 0.15 }
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'database' | 'api'>('database');

  // Hooks
  const { searchCreators, isSearching, searchData } = useLocalCreatorSearch();

  // Watchlists
  const { data: watchlists } = useQuery({
    queryKey: ['creator-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ 
      watchlistId, 
      creator 
    }: { 
      watchlistId: string; 
      creator: any;
    }) => {
      const { data: existingItem } = await supabase
        .from('list_items')
        .select('id')
        .eq('list_id', watchlistId)
        .eq('user_id', creator.user_id || creator.userId)
        .eq('platform', creator.platform)
        .single();
      
      if (existingItem) {
        throw new Error('Creator already exists in this list');
      }

      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: watchlistId,
          platform: creator.platform,
          user_id: creator.user_id || creator.userId,
          username: creator.username,
          snapshot_json: creator,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Search state
  const results = searchData?.results || [];
  const totalResults = searchData?.total || 0;
  const isLoading = isSearching;
  const error = searchData?.error ? new Error(searchData.error) : null;
  const isRateLimited = searchData?.rateLimited || false;

  const {
    profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    isOpen: isProfileOpen,
    openProfile,
    closeProfile,
  } = useCreatorProfile();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());

  // Search execution
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCreators({
        platform,
        query: searchKeyword,
        filters,
        limit: 15,
        offset: currentPage * 15,
        forceApi: searchMode === 'api'
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [platform, searchKeyword, filters, currentPage, searchMode]);

  // Utility functions
  const changePlatform = useCallback((newPlatform: Platform) => {
    setPlatform(newPlatform);
    setCurrentPage(0);
  }, []);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(0);
  }, []);

  const resetSearch = useCallback(() => {
    setSearchKeyword('');
    setFilters({
      followers: { min: 10000, max: 10000000 },
      engagementRate: { min: 0.01, max: 0.15 }
    });
    setCurrentPage(0);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const canGoNext = results.length >= 15;
  const canGoPrev = currentPage > 0;

  const handleSelectCreator = (creatorId: string, selected: boolean) => {
    const newSelected = new Set(selectedCreators);
    if (selected) {
      newSelected.add(creatorId);
    } else {
      newSelected.delete(creatorId);
    }
    setSelectedCreators(newSelected);
  };

  const handleBulkSave = async () => {
    if (selectedCreators.size === 0 || !watchlists?.length) return;
    
    const defaultWatchlist = watchlists[0];
    const selectedResults = results.filter(r => selectedCreators.has(r.user_id));
    
    for (const creator of selectedResults) {
      await addToWatchlistMutation.mutateAsync({ watchlistId: defaultWatchlist.id, creator });
    }
    
    setSelectedCreators(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Discover Creators</h1>
              <p className="text-sm text-muted-foreground">Find and analyze influencers across platforms</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              {selectedCreators.size > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedCreators.size} selected
                  </Badge>
                  <Button size="sm" onClick={handleBulkSave}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save Selected
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Platform Tabs */}
          <Tabs value={platform} onValueChange={changePlatform}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {platforms.map(p => (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  className="flex items-center gap-2"
                >
                  {p.icon}
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex">
        {/* Left Filter Panel */}
        {showFilters && (
          <div className="w-80 border-r border-border bg-muted/20">
            <div className="p-6 space-y-6">
              {/* Search */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Search</Label>
                  <Input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="@username, email, or keyword..."
                    className="w-full"
                  />
              </div>
              
              {/* Search Mode Toggle */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Search Mode</Label>
                <SearchModeToggle
                  searchMode={searchMode}
                  onModeChange={setSearchMode}
                  isDatabaseFirst={true}
                  resultsCount={totalResults}
                  fromDatabase={searchData?.fromDatabase}
                />
              </div>
              
              {/* Filters */}
              <ModernFilterRail
                platform={platform}
                filters={filters}
                onFiltersChange={updateFilters}
                displaySettings={{
                  showEmailOnly: false,
                  hideWatchlisted: false,
                  columns: ['avatar', 'followers', 'engagement', 'actions']
                }}
                onDisplaySettingsChange={() => {}}
              />
            </div>
          </div>
        )}

        {/* Main Results Area */}
        <div className="flex-1">
          <div className="p-6">
            {/* Rate Limit Notice */}
            <RateLimitNotice show={isRateLimited} />
            
            {/* Results Header */}
            {!isLoading && !error && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">
                          {formatNumber(totalResults)} profiles found
                        </span>
                      </div>
                      
                      {searchKeyword && (
                        <Badge variant="secondary">
                          Search: "{searchKeyword}"
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Sort */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Sort by:</Label>
                        <Select defaultValue="followers-desc">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="followers-desc">Most Followers</SelectItem>
                            <SelectItem value="followers-asc">Least Followers</SelectItem>
                            <SelectItem value="engagementRate-desc">Highest Engagement</SelectItem>
                            <SelectItem value="engagementRate-asc">Lowest Engagement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pagination */}
                      {totalResults > 15 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevPage}
                            disabled={!canGoPrev || isLoading}
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
                            disabled={!canGoNext || isLoading}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <EmptyState 
                title={
                  error.message?.includes('Insufficient credits') || error.message?.includes('not enough credits') 
                    ? "Credits Insufficient" 
                    : "Something went wrong"
                }
                description={
                  error.message?.includes('Insufficient credits') || error.message?.includes('not enough credits')
                    ? "Your Modash account doesn't have enough credits for Live API searches. Try using Database mode or upgrade your Modash plan."
                    : error.message || 'Failed to load creators'
                }
                action={
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                }
              />
            ) : results.length > 0 ? (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                  : 'space-y-3'
                }
              `}>
                {results.map((creator) => (
                  <ModernCreatorCard
                    key={`${creator.platform}-${creator.user_id}`}
                    creator={{
                      ...creator,
                      userId: creator.user_id,
                      profilePicUrl: creator.profile_pic_url,
                      fullName: creator.full_name,
                      isVerified: creator.is_verified,
                      hasContactDetails: creator.has_contact_details,
                      engagementRate: creator.engagement_rate,
                      avgLikes: creator.avg_likes,
                      avgViews: creator.avg_views
                    }}
                    isSelected={selectedCreators.has(creator.user_id)}
                    onSelect={handleSelectCreator}
                    watchlists={watchlists || []}
                    onAddToWatchlist={addToWatchlistMutation.mutate}
                    onViewProfile={openProfile}
                    variant={viewMode}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No creators found"
                description="Try adjusting your search terms or filters"
                action={
                  <Button variant="outline" onClick={resetSearch}>
                    Clear all filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      <CreatorProfileSheet
        isOpen={isProfileOpen}
        onClose={closeProfile}
        profileData={profileData}
        isLoading={isLoadingProfile}
        error={profileError}
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
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
import { useModashDiscovery, Platform } from '@/hooks/useModashDiscovery';
import { ModernFilterRail } from './ModernFilterRail';
import { ModernCreatorCard } from './ModernCreatorCard';
import { ModernSearchInput } from './ModernSearchInput';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
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
  const {
    platform,
    changePlatform,
    searchKeyword,
    setSearchKeyword,
    filters,
    updateFilters,
    sort,
    updateSort,
    results,
    totalResults,
    isLoading,
    error,
    suggestions,
    isLoadingSuggestions,
    searchSuggestions,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    currentPage,
    watchlists,
    createWatchlist,
    addToWatchlist,
    resetSearch,
  } = useModashDiscovery();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchKeyword && searchKeyword.length >= 3) {
        searchSuggestions(searchKeyword);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchKeyword, searchSuggestions]);

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
    const selectedResults = results.filter(r => selectedCreators.has(r.userId));
    
    for (const creator of selectedResults) {
      await addToWatchlist({ watchlistId: defaultWatchlist.id, creator });
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
                <ModernSearchInput
                  value={searchKeyword}
                  onChange={setSearchKeyword}
                  suggestions={suggestions}
                  isLoading={isLoadingSuggestions}
                  platform={platform}
                  placeholder="@username, email, or keyword..."
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
                        <Select
                          value={`${sort.field}-${sort.direction}`}
                          onValueChange={(value) => {
                            const [field, direction] = value.split('-');
                            updateSort(field, direction as 'asc' | 'desc');
                          }}
                        >
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
                title="Something went wrong"
                description={error.message || 'Failed to load creators'}
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
                    key={`${creator.platform}-${creator.userId}`}
                    creator={creator}
                    isSelected={selectedCreators.has(creator.userId)}
                    onSelect={handleSelectCreator}
                    watchlists={watchlists || []}
                    onAddToWatchlist={addToWatchlist}
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
    </div>
  );
};
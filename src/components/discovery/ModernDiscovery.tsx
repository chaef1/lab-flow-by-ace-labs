import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Plus, Download, Eye, Bookmark } from 'lucide-react';
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
  icon: string;
  color: string;
}

const platforms: PlatformConfig[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
  { id: 'youtube', label: 'YouTube', icon: '📺', color: 'bg-gradient-to-br from-red-500 to-red-600' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-gradient-to-br from-black to-gray-800' },
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [displaySettings, setDisplaySettings] = useState({
    showEmailOnly: false,
    hideWatchlisted: false,
    columns: ['avatar', 'followers', 'engagement', 'actions']
  });

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

  const handleExportSelected = () => {
    const selectedResults = results.filter(r => selectedCreators.has(r.userId));
    const csvData = selectedResults.map(creator => ({
      username: creator.username,
      platform: creator.platform,
      followers: creator.followers,
      engagement_rate: creator.engagementRate,
      avg_likes: creator.avgLikes,
      verified: creator.isVerified,
      has_contact: creator.hasContactDetails
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creators-${platform}-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Creator Discovery
                </h1>
                <p className="text-sm text-muted-foreground">
                  Find and analyze creators across platforms
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                ⚡ Powered by Modash
              </Badge>
            </div>
            
            {selectedCreators.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedCreators.size} selected
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkSave}
                  className="flex items-center gap-1"
                >
                  <Bookmark className="w-3 h-3" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportSelected}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Filter Rail */}
          <div className="w-80 shrink-0">
            <div className="sticky top-24">
              {/* Platform Tabs */}
              <Tabs value={platform} onValueChange={changePlatform}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  {platforms.map(p => (
                    <TabsTrigger
                      key={p.id}
                      value={p.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span>{p.icon}</span>
                      {p.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Search */}
              <div className="mb-6">
                <ModernSearchInput
                  value={searchKeyword}
                  onChange={setSearchKeyword}
                  suggestions={suggestions}
                  isLoading={isLoadingSuggestions}
                  platform={platform}
                  placeholder={`@username, email, or keyword...`}
                />
              </div>

              {/* Filter Rail */}
              <ModernFilterRail
                platform={platform}
                filters={filters}
                onFiltersChange={updateFilters}
                displaySettings={displaySettings}
                onDisplaySettingsChange={setDisplaySettings}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            {(totalResults > 0 || isLoading) && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Searching...' : `${formatNumber(totalResults)} creators`}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Sort:</Label>
                    <Select
                      value={`${sort.field}-${sort.direction}`}
                      onValueChange={(value) => {
                        const [field, direction] = value.split('-');
                        updateSort(field, direction as 'asc' | 'desc');
                      }}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="followers-desc">Followers ↓</SelectItem>
                        <SelectItem value="followers-asc">Followers ↑</SelectItem>
                        <SelectItem value="engagementRate-desc">Engagement ↓</SelectItem>
                        <SelectItem value="engagementRate-asc">Engagement ↑</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={!canGoPrev || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
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
              </div>
            )}

            {/* Results Grid */}
            {isLoading ? (
              <LoadingSpinner />
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((creator) => (
                  <ModernCreatorCard
                    key={`${creator.platform}-${creator.userId}`}
                    creator={creator}
                    isSelected={selectedCreators.has(creator.userId)}
                    onSelect={handleSelectCreator}
                    watchlists={watchlists || []}
                    onAddToWatchlist={addToWatchlist}
                  />
                ))}
              </div>
            ) : searchKeyword || Object.keys(filters).some(key => 
              key !== 'followers' && key !== 'engagementRate' && filters[key as keyof typeof filters]
            ) ? (
              <EmptyState 
                title="No creators found"
                description="Try adjusting your filters or search terms"
                action={
                  <Button variant="outline" onClick={resetSearch}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <EmptyState 
                title="Start discovering creators"
                description="Use the search bar or filters to find creators"
              />
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">
                  {error.message || 'An error occurred while searching'}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
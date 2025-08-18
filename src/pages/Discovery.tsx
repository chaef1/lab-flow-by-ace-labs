import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Users, 
  Heart, 
  Eye, 
  ExternalLink, 
  BookmarkPlus,
  Filter,
  X,
  TrendingUp,
  MapPin,
  Hash,
  AtSign,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CreatorResult {
  platform: string;
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgViews: number;
  isVerified: boolean;
  topAudience: { country?: string; city?: string };
  matchBadges: string[];
  hasContactDetails: boolean;
}

interface SearchFilters {
  platforms: string[];
  followersMin: number;
  followersMax: number;
  engagementRateMin: number;
  engagementRateMax: number;
  location: string;
  language: string;
  keywords: string[];
  hashtags: string[];
  brands: string[];
  interests: string[];
  hasContactDetails: boolean;
  isVerified: boolean;
  postedWithinDays: number;
  handleSearch: string;
}

const Discovery = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // State
  const [searchResults, setSearchResults] = useState<CreatorResult[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('followers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    platforms: ['instagram'],
    followersMin: 1000,
    followersMax: 1000000,
    engagementRateMin: 0,
    engagementRateMax: 20,
    location: '',
    language: '',
    keywords: [],
    hashtags: [],
    brands: [],
    interests: [],
    hasContactDetails: false,
    isVerified: false,
    postedWithinDays: 30,
    handleSearch: ''
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [brandInput, setBrandInput] = useState('');

  // Search mutation with debouncing
  const searchMutation = useMutation({
    mutationFn: async () => {
      const modashFilters = {
        influencer: {
          followersMin: filters.followersMin,
          followersMax: filters.followersMax,
          hasContactDetails: filters.hasContactDetails,
          isVerified: filters.isVerified,
          postedWithinDays: filters.postedWithinDays,
          keywords: filters.handleSearch ? [filters.handleSearch] : filters.keywords,
          hashtags: filters.hashtags.map(h => h.startsWith('#') ? h : `#${h}`),
          brands: filters.brands,
          interests: filters.interests.map(i => ({ id: i }))
        },
        audience: filters.location ? {
          countries: [{ id: filters.location, minPercent: 20 }]
        } : undefined
      };

      const { data, error } = await supabase.functions.invoke('modash-discovery-search', {
        body: {
          platform: filters.platforms[0] || 'instagram',
          filters: modashFilters,
          sort: { field: sortBy, direction: sortOrder },
          pagination: { page: currentPage, limit: 15 }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSearchResults(data.results || []);
      setTotalResults(data.total || 0);
      if (data.results?.length === 0 && data.lookalikes?.length > 0) {
        setSearchResults(data.lookalikes);
        toast({
          title: "No exact matches found",
          description: "Showing similar creators instead",
        });
      }
    },
    onError: (error: any) => {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Unable to perform search",
        variant: "destructive",
      });
    }
  });

  // Watchlist management
  const { data: watchlists } = useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ watchlistId, creator }: { watchlistId: string; creator: CreatorResult }) => {
      const { data, error } = await supabase
        .from('watchlist_items')
        .insert({
          watchlist_id: watchlistId,
          platform: creator.platform,
          user_id: creator.userId,
          username: creator.username,
          snapshot_kpis: {
            followers: creator.followers,
            engagementRate: creator.engagementRate,
            avgLikes: creator.avgLikes,
            isVerified: creator.isVerified,
            profilePicUrl: creator.profilePicUrl,
            fullName: creator.fullName
          }
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Added to watchlist",
        description: "Creator has been saved to your watchlist",
      });
    }
  });

  // Helper functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const addKeyword = useCallback(() => {
    if (keywordInput.trim() && !filters.keywords.includes(keywordInput.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  }, [keywordInput, filters.keywords]);

  const addHashtag = useCallback(() => {
    if (hashtagInput.trim() && !filters.hashtags.includes(hashtagInput.trim())) {
      setFilters(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtagInput.trim()]
      }));
      setHashtagInput('');
    }
  }, [hashtagInput, filters.hashtags]);

  const addBrand = useCallback(() => {
    if (brandInput.trim() && !filters.brands.includes(brandInput.trim())) {
      setFilters(prev => ({
        ...prev,
        brands: [...prev.brands, brandInput.trim()]
      }));
      setBrandInput('');
    }
  }, [brandInput, filters.brands]);

  const removeFilter = useCallback((type: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: (prev[type] as string[]).filter(item => item !== value)
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      platforms: ['instagram'],
      followersMin: 1000,
      followersMax: 1000000,
      engagementRateMin: 0,
      engagementRateMax: 20,
      location: '',
      language: '',
      keywords: [],
      hashtags: [],
      brands: [],
      interests: [],
      hasContactDetails: false,
      isVerified: false,
      postedWithinDays: 30,
      handleSearch: ''
    });
    setCurrentPage(0);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.keywords.length > 0) count++;
    if (filters.hashtags.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.location) count++;
    if (filters.handleSearch) count++;
    if (filters.hasContactDetails) count++;
    if (filters.isVerified) count++;
    if (filters.followersMin > 1000 || filters.followersMax < 1000000) count++;
    if (filters.engagementRateMin > 0 || filters.engagementRateMax < 20) count++;
    return count;
  }, [filters]);

  // Auto-search on filter changes with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeFiltersCount > 0 || filters.handleSearch) {
        searchMutation.mutate();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, sortBy, sortOrder, currentPage]);

  // CreatorCard component
  const CreatorCard = ({ creator }: { creator: CreatorResult }) => {
    const isSelected = selectedCreators.has(creator.userId);
    
    return (
      <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 ring-2 ring-border">
                <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {creator.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className="font-semibold text-sm line-clamp-1">{creator.fullName || creator.username}</h3>
                  {creator.isVerified && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{creator.username}</p>
                <Badge variant="outline" className="text-xs mt-1 capitalize">
                  {creator.platform}
                </Badge>
              </div>
            </div>
            
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                const newSelected = new Set(selectedCreators);
                if (checked) {
                  newSelected.add(creator.userId);
                } else {
                  newSelected.delete(creator.userId);
                }
                setSelectedCreators(newSelected);
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="w-3 h-3 text-primary" />
                <span className="font-semibold text-sm">{formatNumber(creator.followers)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Heart className="w-3 h-3 text-primary" />
                <span className="font-semibold text-sm">{creator.engagementRate.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Eye className="w-3 h-3 text-primary" />
                <span className="font-semibold text-sm">{formatNumber(creator.avgViews)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Views</div>
            </div>
          </div>

          {creator.matchBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {creator.matchBadges.slice(0, 2).map((badge, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center">
              {creator.topAudience.country && (
                <>
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{creator.topAudience.country}</span>
                </>
              )}
            </div>
            
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {watchlists && watchlists.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <BookmarkPlus className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to Watchlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {watchlists.map(watchlist => (
                        <Button
                          key={watchlist.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addToWatchlistMutation.mutate({
                            watchlistId: watchlist.id,
                            creator
                          })}
                        >
                          {watchlist.name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                <a 
                  href={`https://${creator.platform}.com/${creator.username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Creator Discovery</h1>
            <p className="text-sm text-muted-foreground">Find and analyze creators across Instagram, TikTok, and YouTube</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Mobile Filter Drawer */}
        <div className={`fixed inset-0 z-50 lg:hidden ${isFilterOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsFilterOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {/* Filter content will go here */}
            </div>
          </div>
        </div>

        {/* Desktop Filter Panel */}
        <div className="hidden lg:block w-80 border-r bg-muted/30 p-4 overflow-y-auto h-[calc(100vh-73px)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>

            {/* Handle Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <AtSign className="w-4 h-4 mr-2" />
                Search by Handle
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., username"
                  value={filters.handleSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, handleSearch: e.target.value }))}
                  className="flex-1"
                />
                <Button 
                  onClick={() => searchMutation.mutate()} 
                  size="sm"
                  disabled={searchMutation.isPending}
                >
                  {searchMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Platform Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Tabs
                value={filters.platforms[0]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, platforms: [value] }))}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="instagram">Instagram</TabsTrigger>
                  <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                  <TabsTrigger value="youtube">YouTube</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Followers Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Followers Range</label>
              <div className="space-y-2">
                <Slider
                  value={[filters.followersMin]}
                  onValueChange={([value]) => setFilters(prev => ({ ...prev, followersMin: value }))}
                  max={10000000}
                  min={100}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(filters.followersMin)}+</span>
                  <span>to {formatNumber(filters.followersMax)}</span>
                </div>
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Engagement Rate (%)</label>
              <div className="space-y-2">
                <Slider
                  value={[filters.engagementRateMin, filters.engagementRateMax]}
                  onValueChange={([min, max]) => setFilters(prev => ({ 
                    ...prev, 
                    engagementRateMin: min, 
                    engagementRateMax: max 
                  }))}
                  max={20}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{filters.engagementRateMin}%</span>
                  <span>{filters.engagementRateMax}%</span>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm font-medium">Advanced Filters</span>
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keywords</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter keyword..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      className="flex-1"
                    />
                    <Button onClick={addKeyword} size="sm">Add</Button>
                  </div>
                  {filters.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filters.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                          <button
                            onClick={() => removeFilter('keywords', keyword)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hashtags</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter hashtag..."
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                      className="flex-1"
                    />
                    <Button onClick={addHashtag} size="sm">Add</Button>
                  </div>
                  {filters.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filters.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{hashtag}
                          <button
                            onClick={() => removeFilter('hashtags', hashtag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality Filters */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Quality Filters</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={filters.isVerified}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, isVerified: !!checked }))
                        }
                      />
                      <label htmlFor="verified" className="text-sm">Verified accounts only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contact"
                        checked={filters.hasContactDetails}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, hasContactDetails: !!checked }))
                        }
                      />
                      <label htmlFor="contact" className="text-sm">Has contact details</label>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 p-4 overflow-y-auto h-[calc(100vh-73px)]">
          <div className="space-y-4">
            {/* Search Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {searchMutation.isPending ? (
                    "Searching..."
                  ) : searchResults.length > 0 ? (
                    `${searchResults.length} creators found`
                  ) : (
                    "No results"
                  )}
                </div>
                {searchMutation.isPending && (
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="engagementRate">Engagement Rate</SelectItem>
                    <SelectItem value="avgViews">Avg Views</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Results Grid */}
            {searchMutation.isPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((creator) => (
                  <CreatorCard key={`${creator.platform}-${creator.userId}`} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or search for a specific handle
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {searchResults.length > 0 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 0) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 0 || searchMutation.isPending}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={searchResults.length < 15 || searchMutation.isPending}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discovery;
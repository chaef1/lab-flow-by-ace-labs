import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Dashboard from '@/components/layout/Dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Search, 
  Filter, 
  Heart, 
  ExternalLink, 
  AlertTriangle,
  Users,
  TrendingUp,
  Eye,
  CheckCircle,
  Bookmark
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModashStatus {
  health: { status: string };
  credits: { remaining: number; total: number };
  degraded: boolean;
  message: string;
}

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
  keywords: string;
  followersMin: number;
  followersMax: number;
  engagementRateMin: number;
  hasContactDetails: boolean;
  isVerified: boolean | null;
  postedWithinDays: number;
  hashtags: string[];
  mentions: string[];
  brands: string[];
  interests: string[];
  audienceWeights: {
    gender: number;
    age: number;
    interests: number;
    location: number;
    language: number;
  };
  audienceFilters: {
    femaleMinPercent: number;
    countries: Array<{ id: string; minPercent: number }>;
    cities: Array<{ id: string; minPercent: number }>;
    languages: Array<{ id: string; minPercent: number }>;
    interests: Array<{ id: string; minPercent: number }>;
    age: Array<{ range: string; minPercent: number }>;
  };
}

const defaultFilters: SearchFilters = {
  keywords: '',
  followersMin: 5000,
  followersMax: 500000,
  engagementRateMin: 1,
  hasContactDetails: false,
  isVerified: null,
  postedWithinDays: 60,
  hashtags: [],
  mentions: [],
  brands: [],
  interests: [],
  audienceWeights: {
    gender: 20,
    age: 20,
    interests: 20,
    location: 20,
    language: 20,
  },
  audienceFilters: {
    femaleMinPercent: 0,
    countries: [],
    cities: [],
    languages: [],
    interests: [],
    age: [],
  },
};

const ModashDiscover = () => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch Modash status
  const { data: modashStatus } = useQuery<ModashStatus>({
    queryKey: ['modash-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-status');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('modash-search', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: (error) => {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search creators. Please try again.',
        variant: 'destructive',
      });
      setIsSearching(false);
    },
  });

  const handleSearch = useCallback(() => {
    if (modashStatus?.degraded) {
      toast({
        title: 'Service Unavailable',
        description: modashStatus.message,
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setCurrentPage(1);

    const payload = {
      pagination: { page: 1 },
      sort: { field: sortField, order: sortOrder },
      filters: {
        influencer: {
          followersMin: filters.followersMin,
          followersMax: filters.followersMax,
          hasContactDetails: filters.hasContactDetails || undefined,
          isVerified: filters.isVerified,
          postedWithinDays: filters.postedWithinDays,
          keywords: filters.keywords ? [filters.keywords] : undefined,
          hashtags: filters.hashtags.length > 0 ? filters.hashtags : undefined,
          mentions: filters.mentions.length > 0 ? filters.mentions : undefined,
          brands: filters.brands.length > 0 ? filters.brands : undefined,
          interests: filters.interests.length > 0 ? filters.interests : undefined,
        },
        audience: {
          gender: filters.audienceFilters.femaleMinPercent > 0 ? 
            { femaleMinPercent: filters.audienceFilters.femaleMinPercent } : undefined,
          countries: filters.audienceFilters.countries.length > 0 ? 
            filters.audienceFilters.countries : undefined,
          cities: filters.audienceFilters.cities.length > 0 ? 
            filters.audienceFilters.cities : undefined,
          languages: filters.audienceFilters.languages.length > 0 ? 
            filters.audienceFilters.languages : undefined,
          interests: filters.audienceFilters.interests.length > 0 ? 
            filters.audienceFilters.interests : undefined,
          age: filters.audienceFilters.age.length > 0 ? 
            filters.audienceFilters.age : undefined,
          weights: filters.audienceWeights,
        },
      },
    };

    searchMutation.mutate(payload);
  }, [filters, sortField, sortOrder, modashStatus, searchMutation, toast]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchResults(null);
    setCurrentPage(1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dashboard title="Creator Discovery" subtitle="Find creators with Modash">
      <div className="flex flex-col gap-6">
        {/* Status Banner */}
        {modashStatus && (
          <Alert className={modashStatus.degraded ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{modashStatus.message}</span>
                <span className="text-sm text-muted-foreground">
                  Credits: {modashStatus.credits.remaining.toLocaleString()} remaining
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select value="instagram" disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok" disabled>TikTok (Coming Soon)</SelectItem>
                      <SelectItem value="youtube" disabled>YouTube (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keywords</label>
                  <Input
                    placeholder="fitness, lifestyle..."
                    value={filters.keywords}
                    onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>

                {/* Followers Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Followers</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.followersMin}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          followersMin: parseInt(e.target.value) || 0 
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.followersMax}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          followersMax: parseInt(e.target.value) || 1000000 
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Engagement Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Engagement Rate (%)</label>
                  <Slider
                    value={[filters.engagementRateMin]}
                    onValueChange={([value]) => setFilters(prev => ({ 
                      ...prev, 
                      engagementRateMin: value 
                    }))}
                    max={10}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {filters.engagementRateMin}%
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Has Contact Details</label>
                    <Switch
                      checked={filters.hasContactDetails}
                      onCheckedChange={(checked) => setFilters(prev => ({ 
                        ...prev, 
                        hasContactDetails: checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Verified Only</label>
                    <Switch
                      checked={filters.isVerified === true}
                      onCheckedChange={(checked) => setFilters(prev => ({ 
                        ...prev, 
                        isVerified: checked ? true : null 
                      }))}
                    />
                  </div>
                </div>

                {/* Audience Weight Sliders */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Audience Weights</label>
                  {Object.entries(filters.audienceWeights).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key}</span>
                        <span>{value}%</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => setFilters(prev => ({
                          ...prev,
                          audienceWeights: {
                            ...prev.audienceWeights,
                            [key]: newValue
                          }
                        }))}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSearch} className="flex-1" disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="engagement_rate">Engagement</SelectItem>
                    <SelectItem value="avg_views">Avg Views</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">High to Low</SelectItem>
                    <SelectItem value="asc">Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {searchResults && (
                <div className="text-sm text-muted-foreground">
                  {searchResults.total.toLocaleString()} creators found
                </div>
              )}
            </div>

            {/* Results Grid */}
            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : searchResults?.results?.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.results.map((creator: CreatorResult) => (
                    <Card key={creator.userId} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Creator Header */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={creator.profilePicUrl} />
                              <AvatarFallback>
                                {creator.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="font-medium text-sm truncate">@{creator.username}</p>
                                {creator.isVerified && (
                                  <CheckCircle className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {creator.fullName}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{formatNumber(creator.followers)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{creator.engagementRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{formatNumber(creator.avgLikes)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{formatNumber(creator.avgViews)}</span>
                            </div>
                          </div>

                          {/* Location */}
                          {creator.topAudience.country && (
                            <p className="text-xs text-muted-foreground">
                              📍 {creator.topAudience.city ? `${creator.topAudience.city}, ` : ''}
                              {creator.topAudience.country}
                            </p>
                          )}

                          {/* Match Badges */}
                          {creator.matchBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {creator.matchBadges.slice(0, 2).map((badge, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Bookmark className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://instagram.com/${creator.username}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Lookalikes Section */}
                {!searchResults.meta.exactMatch && searchResults.lookalikes?.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4">
                        No exact matches. Try these similar creators:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.lookalikes.slice(0, 6).map((creator: CreatorResult) => (
                          <Card key={creator.userId} className="hover:shadow-md transition-shadow opacity-75">
                            <CardContent className="p-4">
                              {/* Same creator card content as above */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={creator.profilePicUrl} />
                                    <AvatarFallback>
                                      {creator.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <p className="font-medium text-sm truncate">@{creator.username}</p>
                                      {creator.isVerified && (
                                        <CheckCircle className="h-3 w-3 text-blue-500" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {creator.fullName}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{formatNumber(creator.followers)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{creator.engagementRate.toFixed(1)}%</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <Bookmark className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`https://instagram.com/${creator.username}`, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : searchResults && searchResults.results?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={resetFilters} variant="outline">
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Discover Creators</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the filters on the left to find the perfect creators for your campaigns
                  </p>
                  <Button onClick={handleSearch}>
                    Start Searching
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default ModashDiscover;
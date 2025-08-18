import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
  SlidersHorizontal,
  ArrowLeft,
  MessageSquare,
  Globe,
  ChevronDown,
  Instagram,
  Youtube,
  Music,
  Mail,
  EyeOff,
  Save,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

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
  hasContactDetails?: boolean;
  topAudience?: { country?: string; city?: string };
  recentPosts?: any[];
  growth?: {
    followers30d?: number;
    engagementRate30d?: number;
  };
}

interface FilterState {
  demographics: {
    location: string[];
    gender: string[];
    age: string[];
    language: string[];
  };
  performance: {
    followers: [number, number];
    growth: [number, number];
    engagementRate: [number, number];
  };
  content: {
    hashtags: string[];
    keywords: string;
    interests: string[];
    brands: string[];
  };
  other: {
    emailAvailable: boolean;
    hideSavedProfiles: boolean;
  };
}

const defaultFilters: FilterState = {
  demographics: {
    location: [],
    gender: [],
    age: [],
    language: [],
  },
  performance: {
    followers: [1000, 10000000],
    growth: [-50, 200],
    engagementRate: [0, 20],
  },
  content: {
    hashtags: [],
    keywords: '',
    interests: [],
    brands: [],
  },
  other: {
    emailAvailable: false,
    hideSavedProfiles: false,
  },
};

const platformIcons = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
};

const Discovery = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [platform, setPlatform] = useState<string>(searchParams.get('platform') || 'instagram');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [searchResults, setSearchResults] = useState<CreatorResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState('followers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorResult | null>(null);
  const [showColumns, setShowColumns] = useState({
    followers: true,
    engagementRate: true,
    engagement: true,
    growth: false,
    location: false,
  });

  // Helper functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  // Search mutation with debounce
  const searchMutation = useMutation({
    mutationFn: async () => {
      const searchFilters = {
        influencer: {
          followers: { min: filters.performance.followers[0], max: filters.performance.followers[1] },
          engagementRate: { min: filters.performance.engagementRate[0] / 100, max: filters.performance.engagementRate[1] / 100 },
          hasContactDetails: filters.other.emailAvailable,
          keywords: searchTerm || filters.content.keywords,
          hashtags: filters.content.hashtags,
          interests: filters.content.interests,
          brands: filters.content.brands,
          location: { countries: filters.demographics.location },
          language: filters.demographics.language,
          gender: filters.demographics.gender,
        }
      };

      const { data, error } = await supabase.functions.invoke('modash-discovery-search', {
        body: {
          platform,
          filters: searchFilters,
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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (platform !== 'instagram') params.set('platform', platform);
    if (searchTerm) params.set('q', searchTerm);
    setSearchParams(params);
  }, [platform, searchTerm, setSearchParams]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || Object.values(filters.demographics).some(arr => arr.length > 0) || 
          filters.performance.followers[0] > 1000 || filters.performance.followers[1] < 10000000) {
        setCurrentPage(0);
        searchMutation.mutate();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, platform, sortBy, sortOrder]);

  const handleSearch = () => {
    setCurrentPage(0);
    searchMutation.mutate();
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchTerm('');
    setCurrentPage(0);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.other.emailAvailable) count++;
    if (filters.other.hideSavedProfiles) count++;
    if (filters.performance.followers[0] > 1000 || filters.performance.followers[1] < 10000000) count++;
    if (filters.performance.engagementRate[0] > 0 || filters.performance.engagementRate[1] < 20) count++;
    Object.values(filters.demographics).forEach(arr => {
      if (arr.length > 0) count++;
    });
    Object.values(filters.content).forEach(val => {
      if (Array.isArray(val) && val.length > 0) count++;
      if (typeof val === 'string' && val.length > 0) count++;
    });
    return count;
  }, [filters, searchTerm]);

  const handleCreatorSelect = (creator: CreatorResult) => {
    const key = `${creator.platform}-${creator.userId}`;
    const newSelected = new Set(selectedCreators);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCreators(newSelected);
  };

  const handleSaveCreator = async (creator: CreatorResult) => {
    try {
      const { data: lists } = await supabase
        .from('lists')
        .select('id')
        .eq('created_by', userProfile?.id)
        .limit(1);

      let listId = lists?.[0]?.id;

      if (!listId) {
        const { data: newList } = await supabase
          .from('lists')
          .insert({ name: 'My Watchlist', created_by: userProfile?.id })
          .select()
          .single();
        listId = newList?.id;
      }

      if (listId) {
        await supabase.from('list_items').insert({
          list_id: listId,
          platform: creator.platform,
          user_id: creator.userId,
          username: creator.username,
          snapshot_json: creator as any,
        });

        toast({
          title: "Creator saved",
          description: `${creator.username} has been saved to your watchlist`,
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Unable to save creator",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Powered by</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                Modash API ⚡
              </Badge>
            </div>
          </div>
          
          <div className="pb-4">
            <h1 className="text-3xl font-bold mb-4">Discover Creators</h1>
            
            {/* Platform Tabs */}
            <Tabs value={platform} onValueChange={setPlatform} className="mb-4">
              <TabsList className="grid w-fit grid-cols-3">
                <TabsTrigger value="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </TabsTrigger>
                <TabsTrigger value="youtube" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  TikTok
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Bar */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="@creator or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                {searchMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {totalResults > 0 && `${formatNumber(totalResults)} profiles`}
                  {searchMutation.isPending && "Searching..."}
                </p>
                {selectedCreators.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedCreators.size} selected</Badge>
                    <Button size="sm" variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Bulk Save
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="engagementRate">ER%</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Display
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {Object.entries(showColumns).map(([key, checked]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => setShowColumns(prev => ({ ...prev, [key]: !checked }))}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={checked} />
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-2">
              {searchMutation.isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : searchResults.length > 0 ? (
                searchResults.map((creator) => {
                  const key = `${creator.platform}-${creator.userId}`;
                  const isSelected = selectedCreators.has(key);
                  const PlatformIcon = platformIcons[creator.platform as keyof typeof platformIcons];

                  return (
                    <Card 
                      key={key} 
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedCreator(creator)}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatorSelect(creator);
                          }}
                        >
                          <Checkbox checked={isSelected} />
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={creator.profilePicUrl} />
                            <AvatarFallback>{creator.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium truncate">@{creator.username}</p>
                            {creator.isVerified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                            {creator.hasContactDetails && (
                              <Mail className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{creator.fullName}</p>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          {showColumns.followers && (
                            <div className="text-center">
                              <p className="font-medium">{formatNumber(creator.followers)}</p>
                              <p className="text-xs text-muted-foreground">Followers</p>
                            </div>
                          )}
                          
                          {showColumns.engagementRate && (
                            <div className="text-center">
                              <p className="font-medium">{formatPercentage(creator.engagementRate)}</p>
                              <p className="text-xs text-muted-foreground">ER%</p>
                            </div>
                          )}
                          
                          {showColumns.engagement && (
                            <div className="text-center">
                              <p className="font-medium">{formatNumber(creator.avgLikes || 0)}</p>
                              <p className="text-xs text-muted-foreground">Avg Likes</p>
                            </div>
                          )}

                          {showColumns.location && creator.topAudience?.country && (
                            <div className="text-center">
                              <p className="font-medium">{creator.topAudience.country}</p>
                              <p className="text-xs text-muted-foreground">Top Country</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveCreator(creator);
                            }}
                          >
                            <BookmarkPlus className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <Link to={`/creator/${creator.platform}/${creator.userId}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No creators found matching your criteria</p>
                  <Button variant="outline" onClick={resetFilters}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {totalResults > 15 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {Math.ceil(totalResults / 15)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= Math.ceil(totalResults / 15) - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Other Options */}
            <div>
              <h3 className="font-semibold mb-3">Options</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-available"
                    checked={filters.other.emailAvailable}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({
                        ...prev,
                        other: { ...prev.other, emailAvailable: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="email-available" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email available
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-saved"
                    checked={filters.other.hideSavedProfiles}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({
                        ...prev,
                        other: { ...prev.other, hideSavedProfiles: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="hide-saved" className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    Hide saved profiles
                  </Label>
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="font-semibold mb-3">Demographics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <Input 
                    placeholder="Search countries..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <Input 
                    placeholder="Search languages..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <h3 className="font-semibold mb-3">Performance</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Followers: {formatNumber(filters.performance.followers[0])} - {formatNumber(filters.performance.followers[1])}
                  </Label>
                  <Slider
                    value={filters.performance.followers}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        performance: { ...prev.performance, followers: value as [number, number] }
                      }))
                    }
                    max={10000000}
                    min={1000}
                    step={1000}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">
                    Engagement Rate: {filters.performance.engagementRate[0]}% - {filters.performance.engagementRate[1]}%
                  </Label>
                  <Slider
                    value={filters.performance.engagementRate}
                    onValueChange={(value) =>
                      setFilters(prev => ({
                        ...prev,
                        performance: { ...prev.performance, engagementRate: value as [number, number] }
                      }))
                    }
                    max={20}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <h3 className="font-semibold mb-3">Content</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Keywords</Label>
                  <Input
                    placeholder="Search in bio and captions..."
                    value={filters.content.keywords}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        content: { ...prev.content, keywords: e.target.value }
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Hashtags</Label>
                  <Input
                    placeholder="Enter hashtags..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetFilters}>
              Reset All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setIsFilterOpen(false);
                handleSearch();
              }}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Creator Detail Drawer */}
      {selectedCreator && (
        <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedCreator.profilePicUrl} />
                  <AvatarFallback>{selectedCreator.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span>@{selectedCreator.username}</span>
                    {selectedCreator.isVerified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCreator.fullName}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{formatNumber(selectedCreator.followers)}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </Card>
              
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{formatPercentage(selectedCreator.engagementRate)}</p>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
              </Card>
              
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{formatNumber(selectedCreator.avgLikes || 0)}</p>
                <p className="text-sm text-muted-foreground">Avg Likes</p>
              </Card>
              
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{selectedCreator.topAudience?.country || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Top Country</p>
              </Card>
            </div>

            <div className="flex gap-2 mt-6">
              <Button asChild className="flex-1">
                <Link to={`/creator/${selectedCreator.platform}/${selectedCreator.userId}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Full Report
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveCreator(selectedCreator)}
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Add to Watchlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Discovery;

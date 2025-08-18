import React, { useState, useCallback, useMemo } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state matching Modash API structure
  const [filters, setFilters] = useState({
    influencer: {
      followers: { min: 1000, max: 10000000 },
      hasContactDetails: false,
      isVerified: false,
      lastposted: 30,
      keywords: "",
      textTags: [] as Array<{type: 'hashtag' | 'mention', value: string}>,
      brands: [] as number[],
      interests: [] as number[],
      location: { countries: [] as string[], cities: [] as string[] },
      gender: [] as string[],
      language: [] as string[],
      engagementRate: { min: 0, max: 100 }
    }
  });

  const [platform, setPlatform] = useState('instagram');
  const [engagementRange, setEngagementRange] = useState([0, 100]);
  const [followerRange, setFollowerRange] = useState([1000, 10000000]);

  // Helper functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getFollowerCategory = (followers: number) => {
    if (followers < 10000) return 'Nano: 0-10K';
    if (followers < 100000) return 'Micro: 10K-100K';
    if (followers < 1000000) return 'Macro: 100K-1M';
    return 'Mega: +1M';
  };

  const getEngagementCategory = (rate: number) => {
    if (rate < 2) return 'Low';
    if (rate < 6) return 'Mid';
    return 'High';
  };

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      const searchFilters = {
        ...filters,
        influencer: {
          ...filters.influencer,
          keywords: searchTerm || filters.influencer.keywords,
          followers: { min: followerRange[0], max: followerRange[1] },
          engagementRate: { min: engagementRange[0], max: engagementRange[1] }
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

  const handleSearch = () => {
    setCurrentPage(0);
    searchMutation.mutate();
  };

  const resetFilters = useCallback(() => {
    setFilters({
      influencer: {
        followers: { min: 1000, max: 10000000 },
        hasContactDetails: false,
        isVerified: false,
        lastposted: 30,
        keywords: "",
        textTags: [],
        brands: [],
        interests: [],
        location: { countries: [], cities: [] },
        gender: [],
        language: [],
        engagementRate: { min: 0, max: 100 }
      }
    });
    setSearchTerm('');
    setFollowerRange([1000, 10000000]);
    setEngagementRange([0, 100]);
    setCurrentPage(0);
  }, []);

  const applyFilters = () => {
    handleSearch();
    setIsFilterOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.influencer.hasContactDetails) count++;
    if (followerRange[0] > 1000 || followerRange[1] < 10000000) count++;
    if (engagementRange[0] > 0 || engagementRange[1] < 100) count++;
    return count;
  }, [filters, searchTerm, followerRange, engagementRange]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover Creators
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Search results now powered by</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
              Storylash AI ⚡
            </Badge>
          </div>
        </div>
        
        <div className="px-4 pb-4">
          <h1 className="text-3xl font-bold mb-2">Discover Creators</h1>
          
          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-4">
            {/* Platform Icons */}
            <div className="flex items-center space-x-1 mr-4">
              <Button
                variant={platform === 'instagram' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlatform('instagram')}
                className="w-10 h-10 p-0"
              >
                📷
              </Button>
              <Button
                variant={platform === 'tiktok' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlatform('tiktok')}
                className="w-10 h-10 p-0"
              >
                🎵
              </Button>
              <Button
                variant={platform === 'youtube' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlatform('youtube')}
                className="w-10 h-10 p-0"
              >
                📺
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="w-10 h-10 p-0">
              <MapPin className="w-4 h-4" />
            </Button>
            
            <div className="relative flex-1">
              <Input
                placeholder="_reecemeyer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <Button variant="outline" size="sm" className="w-10 h-10 p-0">
              <Globe className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="w-10 h-10 p-0">
              <MessageSquare className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90 text-white px-6"
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Creators</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Follower Range */}
              <div className="space-y-4">
                <h3 className="font-medium">Follower Range</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Nano: 0-10K</Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Micro: 10K-100K</Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Macro: 100K-1M</Badge>
                  <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-300">Mega: +1M</Badge>
                </div>
                <div className="px-3">
                  <Slider
                    value={followerRange}
                    onValueChange={setFollowerRange}
                    min={1000}
                    max={10000000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>&lt;1K</span>
                    <span>10K</span>
                    <span>100K</span>
                    <span>1M</span>
                    <span>10M+</span>
                  </div>
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="font-medium">Country</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="font-medium">Language</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="font-medium">Gender ⚧</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Engagement Range */}
              <div className="space-y-4">
                <h3 className="font-medium">Engagement Range</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Low</Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Mid</Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">High</Badge>
                </div>
                <div className="px-3">
                  <Slider
                    value={engagementRange}
                    onValueChange={setEngagementRange}
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span>2%</span>
                    <span>4%</span>
                    <span>6%+</span>
                  </div>
                </div>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="font-medium">City 💡</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="nyc">New York City</SelectItem>
                    <SelectItem value="la">Los Angeles</SelectItem>
                    <SelectItem value="chicago">Chicago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="font-medium">Category</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notInLists"
                    checked={filters.influencer.hasContactDetails}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        influencer: { ...prev.influencer, hasContactDetails: !!checked }
                      }))
                    }
                  />
                  <label htmlFor="notInLists" className="text-sm flex items-center">
                    📋 Only Creators not in my Lists
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withEmail"
                    checked={filters.influencer.isVerified}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        influencer: { ...prev.influencer, isVerified: !!checked }
                      }))
                    }
                  />
                  <label htmlFor="withEmail" className="text-sm flex items-center">
                    ✉️ Only Creators with email address 💡
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90 text-white">
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results */}
      <div className="p-4">
        {searchMutation.isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((creator) => (
              <Card key={creator.userId} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
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
                      checked={selectedCreators.has(creator.userId)}
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <BookmarkPlus className="w-3 h-3" />
                      </Button>
                      
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No creators found. Try adjusting your search filters.</p>
            </div>
            <Button onClick={resetFilters} variant="outline">
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
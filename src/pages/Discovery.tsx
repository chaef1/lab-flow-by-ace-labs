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
import { useModashSearch } from '@/hooks/useModashSearch';
import { CreatorCard } from '@/components/discovery/CreatorCard';
import { useToast } from '@/hooks/use-toast';
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
  const { searchKeyword, setSearchKeyword, useDictionary } = useModashDiscovery();
  const { 
    platform, 
    results, 
    isLoading, 
    search, 
    changePlatform,
    nextPage,
    prevPage,
    currentPage,
    totalResults
  } = useModashSearch();
  
  const [filters, setFilters] = useState<any>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [followerRange, setFollowerRange] = useState([1000, 10000000]);
  const [engagementRange, setEngagementRange] = useState([0, 20]);

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

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    
    const searchFilters = {
      influencer: {
        keywords: searchKeyword,
        followers: { min: followerRange[0], max: followerRange[1] },
        engagementRate: { min: engagementRange[0] / 100, max: engagementRange[1] / 100 },
        ...filters.influencer
      }
    };
    
    search(searchFilters);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

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
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
              Powered by Modash ⚡
            </Badge>
          </div>
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
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={`Search ${platform} creators by @username, email or keyword...`}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Search
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
                  {results.map((creator, index) => (
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
              ) : searchKeyword || Object.keys(filters).length > 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No creators found matching your criteria</p>
                  <Button variant="outline" className="mt-4" onClick={() => {
                    setSearchKeyword('');
                    setFilters({});
                  }}>
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">Start Your Discovery</h3>
                  <p className="text-muted-foreground">Search for creators by username, email, or use filters to find the perfect match</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Filters Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Audience Size */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Follower Count</Label>
                <Slider
                  value={followerRange}
                  onValueChange={setFollowerRange}
                  max={10000000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(followerRange[0])}</span>
                  <span>{formatNumber(followerRange[1])}</span>
                </div>
              </div>

              <Separator />

              {/* Engagement Rate */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Engagement Rate (%)</Label>
                <Slider
                  value={engagementRange}
                  onValueChange={setEngagementRange}
                  max={20}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{engagementRange[0]}%</span>
                  <span>{engagementRange[1]}%</span>
                </div>
              </div>

              <Separator />

              {/* Additional Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Additional Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="verified"
                      checked={filters.verified}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, verified: checked }))}
                    />
                    <Label htmlFor="verified" className="text-sm">Verified accounts only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="contact"
                      checked={filters.hasContact}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasContact: checked }))}
                    />
                    <Label htmlFor="contact" className="text-sm">Has contact details</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFollowerRange([1000, 10000000]);
                    setEngagementRange([0, 20]);
                    setFilters({});
                  }}
                  className="flex-1"
                >
                  Reset Filters
                </Button>
                <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Dashboard>
  );
};

export default Discovery;
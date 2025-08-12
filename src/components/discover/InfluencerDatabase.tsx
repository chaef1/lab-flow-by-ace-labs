import { useState } from 'react';
import { useInfluencerAssignments } from '@/hooks/useInfluencerAssignments';
import { InfluencerCard } from '@/components/influencers/InfluencerCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AnalyticsDashboard } from '@/components/influencers/AnalyticsDashboard';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, TrendingUp, MapPin } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const InfluencerDatabase = () => {
  const { influencers, isLoading, error } = useInfluencerAssignments();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        Error loading influencers: {error.message}
      </div>
    );
  }

  // Extract unique categories and platforms
  const categories = [...new Set(influencers?.flatMap(inf => inf.categories || []) || [])];
  const platforms = [...new Set(influencers?.map(inf => inf.platform) || [])].filter(Boolean);

  // Filter influencers
  const filteredInfluencers = influencers?.filter(influencer => {
    const matchesSearch = !searchTerm || 
      influencer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      influencer.categories?.includes(selectedCategory);
    
    const matchesPlatform = selectedPlatform === 'all' || 
      influencer.platform === selectedPlatform;

    return matchesSearch && matchesCategory && matchesPlatform;
  }) || [];

  const handleInfluencerClick = (influencer: any) => {
    setSelectedInfluencer(influencer);
    setIsSheetOpen(true);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Influencer Database</h2>
          <Badge variant="secondary" className="ml-auto">
            {filteredInfluencers.length} creators
          </Badge>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50">
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {typeof platform === 'string' ? platform.charAt(0).toUpperCase() + platform.slice(1) : platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={String(category)} value={String(category)}>
                  {String(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Influencers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInfluencers.map((influencer) => (
            <div
              key={influencer.id}
              onClick={() => handleInfluencerClick(influencer)}
              className="group cursor-pointer transform transition-all duration-200 hover:scale-105"
            >
              <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={influencer.profile_picture_url} />
                    <AvatarFallback>
                      {influencer.username?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {influencer.full_name || influencer.username}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      @{influencer.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{influencer.follower_count?.toLocaleString() || 0} followers</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{(influencer.engagement_rate * 100)?.toFixed(1) || 0}% engagement</span>
                  </div>

                  {(influencer.location_city || influencer.location_country) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {[influencer.location_city, influencer.location_country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {influencer.platform?.charAt(0).toUpperCase() + influencer.platform?.slice(1)}
                    </Badge>
                    {influencer.creator_score && influencer.creator_score > 0.8 && (
                      <Badge variant="secondary" className="text-xs">
                        Top Creator
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInfluencers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}

        {/* Analytics Sheet - 25% of screen width */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-[25vw] max-w-none overflow-y-auto">
            {selectedInfluencer && (
              <>
                <SheetHeader className="pb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedInfluencer.profile_picture_url} />
                      <AvatarFallback className="text-lg">
                        {selectedInfluencer.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-xl">
                        {selectedInfluencer.full_name || selectedInfluencer.username}
                      </SheetTitle>
                      <p className="text-muted-foreground">@{selectedInfluencer.username}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {selectedInfluencer.platform?.charAt(0).toUpperCase() + selectedInfluencer.platform?.slice(1)}
                        </Badge>
                        <Badge variant="secondary">
                          {selectedInfluencer.follower_count?.toLocaleString() || 0} followers
                        </Badge>
                        {selectedInfluencer.creator_score && selectedInfluencer.creator_score > 0.8 && (
                          <Badge variant="secondary">Top Creator</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-6">
                  {selectedInfluencer.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">Bio</h4>
                      <p className="text-sm text-muted-foreground">{selectedInfluencer.bio}</p>
                    </div>
                  )}

                  <AnalyticsDashboard influencer={selectedInfluencer} />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ErrorBoundary>
  );
};
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  Heart, 
  Eye, 
  ExternalLink, 
  BookmarkPlus,
  AlertCircle,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface SearchResponse {
  page: number;
  pageSize: number;
  total: number;
  results: CreatorResult[];
  lookalikes: CreatorResult[];
  meta: {
    exactMatch: boolean;
    estimatedCredits: number;
  };
}

interface ModashStatus {
  health: { status: string };
  credits: { remaining: number; total: number };
  plan: string;
  degraded: boolean;
  message: string;
}

const ModashDiscovery = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const { toast } = useToast();

  // Fetch Modash status
  const { data: status } = useQuery({
    queryKey: ['modash-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-status');
      if (error) throw error;
      return data as ModashStatus;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('modash-search', {
        body: payload
      });
      if (error) throw error;
      return data as SearchResponse;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      if (data.results.length === 0 && data.lookalikes.length > 0) {
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
    },
  });

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      toast({
        title: "Enter search keywords",
        description: "Please enter some keywords to search for creators",
        variant: "destructive",
      });
      return;
    }

    if (status?.degraded) {
      toast({
        title: "Service unavailable",
        description: status.message,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      pagination: { page: 1 },
      sort: { field: 'relevance', order: 'desc' },
      filters: {
        influencer: {
          followersMin: 1000,
          followersMax: 1000000,
          keywords: [searchKeyword],
          postedWithinDays: 30,
        }
      }
    };

    searchMutation.mutate(payload);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const CreatorCard = ({ creator }: { creator: CreatorResult }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
              <AvatarFallback>{creator.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-1">
                <h3 className="font-semibold">{creator.fullName || creator.username}</h3>
                {creator.isVerified && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{creator.username}</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            <BookmarkPlus className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">{formatNumber(creator.followers)}</span>
            </div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Heart className="w-4 h-4" />
              <span className="font-medium">{creator.engagementRate.toFixed(1)}%</span>
            </div>
            <div className="text-muted-foreground">Engagement</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{formatNumber(creator.avgViews)}</span>
            </div>
            <div className="text-muted-foreground">Avg Views</div>
          </div>
        </div>

        {creator.matchBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {creator.matchBadges.map((badge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {creator.topAudience.country && (
              <span>{creator.topAudience.country}</span>
            )}
            {creator.topAudience.city && creator.topAudience.country && (
              <span>, {creator.topAudience.city}</span>
            )}
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <a 
              href={`https://instagram.com/${creator.username}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const SearchSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modash Discovery</h1>
          <p className="text-muted-foreground">
            Discover Instagram creators with advanced audience insights
          </p>
        </div>
      </div>

      {/* Status Banner */}
      {status && (
        <Alert className={status.degraded ? "border-destructive" : "border-green-500"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{status.message}</span>
              <span className="text-sm">
                Credits: {status.credits.remaining} / {status.credits.total}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Enter keywords, brands, or topics..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={searchMutation.isPending || status?.degraded}
            >
              <Search className="w-4 h-4 mr-2" />
              {searchMutation.isPending ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searchMutation.isPending && <SearchSkeleton />}

      {searchResults && !searchMutation.isPending && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {searchResults.results.length > 0 ? (
                `Found ${searchResults.total} creators`
              ) : (
                'Similar creators'
              )}
            </h2>
            <div className="text-sm text-muted-foreground">
              Credits used: {searchResults.meta.estimatedCredits}
            </div>
          </div>

          {/* Creator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(searchResults.results.length > 0 ? searchResults.results : searchResults.lookalikes).map((creator) => (
              <CreatorCard key={creator.userId} creator={creator} />
            ))}
          </div>

          {/* No Results */}
          {searchResults.results.length === 0 && searchResults.lookalikes.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No creators found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModashDiscovery;

import { useState, useEffect } from 'react';
import Dashboard from '@/components/layout/Dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Star, Instagram, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SocialMediaSearch from '@/components/influencers/SocialMediaSearch';

interface InfluencerProfile {
  id: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  follower_count: number;
  engagement_rate: number;
  rate_per_post: number | null;
  bio: string | null;
  categories: string[] | null;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

const Influencers = () => {
  const navigate = useNavigate();
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select(`
          id,
          instagram_handle,
          tiktok_handle,
          youtube_handle,
          follower_count,
          engagement_rate,
          rate_per_post,
          bio,
          categories,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('follower_count', { ascending: false });

      if (error) {
        console.error('Error fetching influencers:', error);
        toast.error('Failed to fetch influencers');
        return;
      }

      console.log('Fetched influencers:', data);
      setInfluencers(data || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      toast.error('Failed to fetch influencers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInfluencers = influencers.filter((influencer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      influencer.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      influencer.profiles?.last_name?.toLowerCase().includes(searchLower) ||
      influencer.instagram_handle?.toLowerCase().includes(searchLower) ||
      influencer.tiktok_handle?.toLowerCase().includes(searchLower) ||
      influencer.youtube_handle?.toLowerCase().includes(searchLower) ||
      influencer.categories?.some(cat => cat.toLowerCase().includes(searchLower))
    );
  });

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <Dashboard title="Influencers" subtitle="Discover and manage influencer partnerships">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ace-500"></div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard title="Influencers" subtitle="Discover and manage influencer partnerships">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search influencers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <SocialMediaSearch onInfluencerFound={fetchInfluencers} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInfluencers.map((influencer) => (
            <Card 
              key={influencer.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/influencers/${influencer.id}`)}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  {influencer.profiles?.avatar_url ? (
                    <img 
                      src={influencer.profiles.avatar_url} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <CardTitle className="text-lg">
                  {influencer.profiles?.first_name} {influencer.profiles?.last_name}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatFollowerCount(influencer.follower_count)} followers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-center gap-2">
                  {influencer.instagram_handle && (
                    <Badge variant="secondary" className="text-xs">
                      <Instagram className="h-3 w-3 mr-1" />
                      Instagram
                    </Badge>
                  )}
                  {influencer.tiktok_handle && (
                    <Badge variant="secondary" className="text-xs">
                      TikTok
                    </Badge>
                  )}
                  {influencer.youtube_handle && (
                    <Badge variant="secondary" className="text-xs">
                      YouTube
                    </Badge>
                  )}
                </div>
                
                {influencer.categories && influencer.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {influencer.categories.slice(0, 2).map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {influencer.categories.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{influencer.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm text-center">
                  <div>
                    <div className="font-medium">{(influencer.engagement_rate * 100).toFixed(1)}%</div>
                    <div className="text-muted-foreground text-xs">Engagement</div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {influencer.rate_per_post ? `$${influencer.rate_per_post}` : 'N/A'}
                    </div>
                    <div className="text-muted-foreground text-xs">Per Post</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInfluencers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No influencers found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by searching for influencers on social media platforms.'}
            </p>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default Influencers;

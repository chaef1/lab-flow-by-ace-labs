
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Dashboard from '@/components/layout/Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Instagram, Users, Star, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  portfolio_images: string[] | null;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

const InfluencerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [influencer, setInfluencer] = useState<InfluencerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInfluencerProfile(id);
    }
  }, [id]);

  const fetchInfluencerProfile = async (influencerId: string) => {
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
          portfolio_images,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', influencerId)
        .single();

      if (error) {
        console.error('Error fetching influencer profile:', error);
        toast.error('Failed to fetch influencer profile');
        return;
      }

      console.log('Fetched influencer profile:', data);
      setInfluencer(data);
    } catch (error) {
      console.error('Error fetching influencer profile:', error);
      toast.error('Failed to fetch influencer profile');
    } finally {
      setIsLoading(false);
    }
  };

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
      <Dashboard>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ace-500"></div>
        </div>
      </Dashboard>
    );
  }

  if (!influencer) {
    return (
      <Dashboard>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Influencer not found</h3>
          <p className="text-gray-500 mb-4">The influencer profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/influencers')}>
            Back to Influencers
          </Button>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/influencers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Influencers
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  {influencer.profiles?.avatar_url ? (
                    <img 
                      src={influencer.profiles.avatar_url} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <CardTitle className="text-xl">
                  {influencer.profiles?.first_name} {influencer.profiles?.last_name}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatFollowerCount(influencer.follower_count)} followers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Social Media</h4>
                  <div className="space-y-1">
                    {influencer.instagram_handle && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        <span className="text-sm">@{influencer.instagram_handle}</span>
                      </div>
                    )}
                    {influencer.tiktok_handle && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">TT</span>
                        <span className="text-sm">@{influencer.tiktok_handle}</span>
                      </div>
                    )}
                    {influencer.youtube_handle && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">YT</span>
                        <span className="text-sm">@{influencer.youtube_handle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {influencer.categories && influencer.categories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Categories</h4>
                    <div className="flex flex-wrap gap-1">
                      {influencer.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Followers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatFollowerCount(influencer.follower_count)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(influencer.engagement_rate * 100).toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rate per Post</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {influencer.rate_per_post ? `$${influencer.rate_per_post}` : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {influencer.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{influencer.bio}</p>
                </CardContent>
              </Card>
            )}

            {influencer.portfolio_images && influencer.portfolio_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {influencer.portfolio_images.map((image, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={image} 
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default InfluencerProfile;

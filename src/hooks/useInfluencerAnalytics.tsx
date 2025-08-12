import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InfluencerAnalytics {
  followerGrowth: {
    total: number;
    growth: number;
    newFollowers: number;
    unfollowers: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    topCities: string[];
  };
  engagement: {
    rate: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
  };
  recentPosts: Array<{
    id: string;
    caption: string;
    likes: number;
    comments: number;
    timestamp: string;
    media_url?: string;
  }>;
}

export function useInfluencerAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (influencerId: string, platform: string = 'instagram'): Promise<InfluencerAnalytics | null> => {
    try {
      setLoading(true);
      setError(null);

      // Get user's Ayrshare profile key
      const { data: profile } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.ayrshare_profile_key) {
        throw new Error('Ayrshare profile key not found. Please connect your social accounts first.');
      }

      // Fetch account insights for specific platform only
      const { data, error: functionError } = await supabase.functions.invoke('ayrshare-analytics', {
        body: {
          action: 'account_insights',
          platform: platform, // Use specific platform instead of 'all'
          timeRange: '30d',
          profileKey: profile.ayrshare_profile_key
        }
      });

      if (functionError) {
        console.error('Ayrshare function error:', functionError);
        throw functionError;
      }
      if (!data?.success) {
        console.error('Ayrshare API error:', data?.error);
        throw new Error(data?.error || 'Failed to fetch analytics');
      }

      return transformAnalyticsData(data.data);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInfluencerWithAnalytics = async (influencerId: string, handle: string, platform: string = 'instagram') => {
    try {
      setLoading(true);
      setError(null);

      // Get user's Ayrshare profile key
      const { data: profile } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.ayrshare_profile_key) {
        throw new Error('Ayrshare profile key not found');
      }

      // Fetch fresh analytics data for specific platform
      const { data, error: functionError } = await supabase.functions.invoke('ayrshare-analytics', {
        body: {
          action: 'account_insights',
          platform: platform, // Use specific platform, not 'all'
          timeRange: '30d',
          profileKey: profile.ayrshare_profile_key
        }
      });

      if (functionError) throw functionError;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch analytics');

      const analytics = data.data;
      
      // Extract relevant platform data
      const platformData = analytics[platform];
      if (!platformData?.analytics) {
        throw new Error(`No analytics data found for ${platform}`);
      }

      const stats = platformData.analytics;

      // Update influencer with real analytics data
      const updateData = {
        follower_count: stats.followersCount || stats.fanCount || 0,
        engagement_rate: calculateEngagementRate(stats),
        avg_likes: stats.likeCount || 0,
        avg_comments: stats.commentsCount || 0,
        verified: stats.verified || false,
        audience_insights: {
          demographics: {
            ageGroups: stats.audienceGenderAge || {},
            locations: stats.audienceCity || {},
            countries: stats.audienceCountry || {}
          },
          engagement: {
            totalLikes: stats.likeCount || 0,
            totalComments: stats.commentsCount || 0,
            totalViews: stats.viewsCount || 0,
            totalReach: stats.reachCount || 0
          }
        },
        updated_at: new Date().toISOString()
      };

      // Update the influencer record
      const { error: updateError } = await supabase
        .from('influencers')
        .update(updateData)
        .eq('id', influencerId);

      if (updateError) throw updateError;

      return updateData;
    } catch (err: any) {
      console.error('Update influencer analytics error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchAnalytics,
    updateInfluencerWithAnalytics,
    loading,
    error
  };
}

function transformAnalyticsData(data: any): InfluencerAnalytics {
  // Extract Instagram data (primary platform)
  const instagram = data.instagram?.analytics || {};
  const facebook = data.facebook?.analytics || {};
  
  return {
    followerGrowth: {
      total: instagram.followersCount || facebook.followersCount || 0,
      growth: 0, // Would need historical data
      newFollowers: facebook.pageFanAdds || 0,
      unfollowers: facebook.pageFanRemoves || 0
    },
    demographics: {
      ageGroups: parseAgeGroups(instagram.audienceGenderAge || {}),
      genders: parseGenders(instagram.audienceGenderAge || {}),
      topCities: Object.keys(instagram.audienceCity || {}).slice(0, 10)
    },
    engagement: {
      rate: calculateEngagementRate(instagram),
      avgLikes: instagram.likeCount || 0,
      avgComments: instagram.commentsCount || 0,
      avgShares: 0
    },
    recentPosts: [] // Would need additional API calls for recent posts
  };
}

function calculateEngagementRate(stats: any): number {
  const followers = stats.followersCount || stats.fanCount || 1;
  const likes = stats.likeCount || 0;
  const comments = stats.commentsCount || 0;
  const mediaCount = stats.mediaCount || 1;
  
  if (followers === 0 || mediaCount === 0) return 0;
  
  const avgEngagementPerPost = (likes + comments) / mediaCount;
  return Number(((avgEngagementPerPost / followers) * 100).toFixed(2));
}

function parseAgeGroups(audienceData: Record<string, number>): Record<string, number> {
  const ageGroups: Record<string, number> = {};
  
  Object.entries(audienceData).forEach(([key, value]) => {
    // Key format: "F.18-24", "M.25-34", etc.
    const ageRange = key.split('.')[1];
    if (ageRange) {
      ageGroups[ageRange] = (ageGroups[ageRange] || 0) + value;
    }
  });
  
  return ageGroups;
}

function parseGenders(audienceData: Record<string, number>): Record<string, number> {
  const genders = { female: 0, male: 0, unknown: 0 };
  
  Object.entries(audienceData).forEach(([key, value]) => {
    const gender = key.split('.')[0];
    if (gender === 'F') genders.female += value;
    else if (gender === 'M') genders.male += value;
    else genders.unknown += value;
  });
  
  return genders;
}
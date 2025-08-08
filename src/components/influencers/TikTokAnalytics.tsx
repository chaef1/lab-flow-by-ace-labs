import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share } from 'lucide-react';

interface TikTokAnalyticsProps {
  profile: any;
  onAnalyticsUpdate?: (analytics: any) => void;
}

export function TikTokAnalytics({ profile, onAnalyticsUpdate }: TikTokAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const fetchEnhancedAnalytics = async () => {
    setIsLoading(true);
    
    try {
      // First try TikTok Research API for detailed analytics
      const { data: researchData, error: researchError } = await supabase.functions.invoke('tiktok-research-api', {
        body: {
          username: profile.username,
          action: 'get_enhanced_analytics'
        }
      });

      if (!researchError && researchData?.success) {
        setAnalytics(researchData);
        onAnalyticsUpdate?.(researchData);
        toast({
          title: "Analytics Updated",
          description: "Detailed TikTok analytics retrieved successfully"
        });
        return;
      }

      // Fallback to enhanced Ayrshare data
      const enhancedAnalytics = calculateEnhancedMetrics(profile);
      setAnalytics({
        success: true,
        source: 'enhanced_calculation',
        ...enhancedAnalytics
      });
      
      onAnalyticsUpdate?.(enhancedAnalytics);
      
      toast({
        title: "Analytics Calculated",
        description: "Analytics calculated from available profile data"
      });
      
    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to retrieve detailed analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEnhancedMetrics = (profileData: any) => {
    const followers = profileData.follower_count || 0;
    const totalLikes = profileData.total_likes || profileData.heart_count || 0;
    const videoCount = profileData.video_count || profileData.posts_count || 1;
    const avgLikes = totalLikes / videoCount;
    const engagementRate = followers > 0 ? (avgLikes / followers) * 100 : 0;

    return {
      user_info: {
        display_name: profileData.full_name,
        follower_count: followers,
        following_count: profileData.following_count || 0,
        video_count: videoCount,
        likes_count: totalLikes,
        engagement_rate: Math.round(engagementRate * 100) / 100
      },
      enhanced_metrics: {
        influence_score: profileData.influence_score || calculateInfluenceScore(profileData),
        avg_likes_per_video: Math.round(avgLikes),
        content_frequency: profileData.content_frequency || 'Unknown',
        audience_reach_percentage: profileData.audience_reach || 0,
        performance_indicators: {
          viral_potential: engagementRate > 5 ? 'High' : engagementRate > 2 ? 'Medium' : 'Low',
          consistency_score: videoCount > 50 ? 'High' : videoCount > 20 ? 'Medium' : 'Low',
          growth_indicator: 'Stable' // Would need historical data for actual calculation
        }
      },
      video_analytics: {
        total_videos: videoCount,
        avg_performance: {
          likes: Math.round(avgLikes),
          estimated_views: Math.round(avgLikes * 20), // Rough estimation
          estimated_comments: Math.round(avgLikes * 0.05),
          estimated_shares: Math.round(avgLikes * 0.02)
        }
      }
    };
  };

  const calculateInfluenceScore = (profile: any) => {
    const followers = profile.follower_count || 0;
    const engagement = profile.engagement_rate || 0;
    const videos = profile.video_count || 0;
    const verified = profile.verified || false;

    const followerWeight = Math.log10(Math.max(followers, 1)) * 10;
    const engagementWeight = Math.min(engagement * 2, 40);
    const contentWeight = Math.min(videos / 10, 20);
    const verifiedWeight = verified ? 20 : 0;

    return Math.min(Math.round(followerWeight + engagementWeight + contentWeight + verifiedWeight), 100);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">TikTok Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive performance metrics for @{profile.username}
            </p>
          </div>
          <Button 
            onClick={fetchEnhancedAnalytics}
            disabled={isLoading}
            className="flex items-center"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {isLoading ? 'Loading...' : 'Get Analytics'}
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="font-semibold">{formatNumber(analytics.user_info?.follower_count || 0)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Videos</p>
                <p className="font-semibold">{analytics.user_info?.video_count || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="font-semibold">{formatNumber(analytics.user_info?.likes_count || 0)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="font-semibold">{analytics.user_info?.engagement_rate || 0}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Metrics */}
      {analytics?.enhanced_metrics && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Performance Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Influence Score</span>
                  <Badge variant="outline">{analytics.enhanced_metrics.influence_score}/100</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${analytics.enhanced_metrics.influence_score}%` }}
                  />
                </div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Avg Likes per Video</span>
                <p className="font-semibold">{formatNumber(analytics.enhanced_metrics.avg_likes_per_video)}</p>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Content Frequency</span>
                <p className="font-semibold">{analytics.enhanced_metrics.content_frequency}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Viral Potential</span>
                <Badge className={`ml-2 ${
                  analytics.enhanced_metrics.performance_indicators?.viral_potential === 'High' ? 'bg-green-100 text-green-800' :
                  analytics.enhanced_metrics.performance_indicators?.viral_potential === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analytics.enhanced_metrics.performance_indicators?.viral_potential}
                </Badge>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Consistency Score</span>
                <Badge className={`ml-2 ${
                  analytics.enhanced_metrics.performance_indicators?.consistency_score === 'High' ? 'bg-green-100 text-green-800' :
                  analytics.enhanced_metrics.performance_indicators?.consistency_score === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analytics.enhanced_metrics.performance_indicators?.consistency_score}
                </Badge>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Audience Reach</span>
                <p className="font-semibold">{analytics.enhanced_metrics.audience_reach_percentage}%</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Video Performance Estimates */}
      {analytics?.video_analytics && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Video Performance Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Eye className="h-5 w-5 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-muted-foreground">Avg Views</p>
              <p className="font-semibold">{formatNumber(analytics.video_analytics.avg_performance?.estimated_views || 0)}</p>
            </div>
            
            <div className="text-center">
              <Heart className="h-5 w-5 mx-auto text-red-500 mb-2" />
              <p className="text-sm text-muted-foreground">Avg Likes</p>
              <p className="font-semibold">{formatNumber(analytics.video_analytics.avg_performance?.likes || 0)}</p>
            </div>
            
            <div className="text-center">
              <MessageCircle className="h-5 w-5 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">Avg Comments</p>
              <p className="font-semibold">{analytics.video_analytics.avg_performance?.estimated_comments || 0}</p>
            </div>
            
            <div className="text-center">
              <Share className="h-5 w-5 mx-auto text-purple-500 mb-2" />
              <p className="text-sm text-muted-foreground">Avg Shares</p>
              <p className="font-semibold">{analytics.video_analytics.avg_performance?.estimated_shares || 0}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Data Source Info */}
      {analytics && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Data Source: {analytics.source === 'tiktok_research_api' ? 'TikTok Research API' : 'Enhanced Ayrshare + Calculations'}
            </span>
            <Badge variant="outline" className="text-xs">
              {analytics.source === 'tiktok_research_api' ? 'Live Data' : 'Estimated'}
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
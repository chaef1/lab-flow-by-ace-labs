import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Download, 
  Share2,
  Instagram,
  Youtube,
  Music,
  Users,
  Heart,
  Eye,
  TrendingUp,
  BarChart3,
  X
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const platformIcons = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
};

interface ComparisonCreator {
  platform: string;
  userId: string;
  username: string;
  report?: any;
  performance?: any;
}

const Compare = () => {
  const [searchParams] = useSearchParams();
  const creatorIds = searchParams.get('ids')?.split(',') || [];
  const [creators, setCreators] = useState<ComparisonCreator[]>([]);

  // Parse creator IDs from URL
  React.useEffect(() => {
    const parsedCreators = creatorIds.map(id => {
      const [platform, userId] = id.split(':');
      return { platform, userId, username: userId };
    });
    setCreators(parsedCreators);
  }, [creatorIds]);

  // Fetch reports for all creators
  const { data: reports, isLoading } = useQuery({
    queryKey: ['compare-creators', creatorIds],
    queryFn: async () => {
      const reportPromises = creators.map(async (creator) => {
        try {
          const { data, error } = await supabase.functions.invoke('modash-creator-report', {
            body: { platform: creator.platform, userId: creator.userId }
          });
          if (error) throw error;
          return { ...creator, report: data };
        } catch (error) {
          console.error(`Failed to fetch report for ${creator.userId}:`, error);
          return { ...creator, report: null };
        }
      });
      
      return Promise.all(reportPromises);
    },
    enabled: creators.length > 0
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const removeCreator = (index: number) => {
    const newIds = creatorIds.filter((_, i) => i !== index);
    const newUrl = newIds.length > 0 ? `/compare?ids=${newIds.join(',')}` : '/discover';
    window.location.href = newUrl;
  };

  if (creators.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Link to="/discover" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discovery
          </Link>
          <Card className="p-8 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Creators to Compare</h2>
            <p className="text-muted-foreground mb-4">
              Select creators from the discovery page to compare their performance and metrics.
            </p>
            <Button asChild>
              <Link to="/discover">Start Discovering</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/discover" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Discovery
              </Link>
              <h1 className="text-2xl font-bold">Compare Creators</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share Comparison
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Creator Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {reports?.map((creator, index) => {
                const profile = creator.report?.profile;
                const PlatformIcon = platformIcons[creator.platform as keyof typeof platformIcons];
                
                return (
                  <Card key={index} className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => removeCreator(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={profile?.picture} />
                          <AvatarFallback>
                            {profile?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold truncate">@{profile?.username}</p>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {profile?.fullName}
                          </p>
                          {profile?.isVerified && (
                            <Badge variant="secondary" className="mt-1">Verified</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Followers</span>
                          <span className="font-semibold">{formatNumber(profile?.followers || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Engagement Rate</span>
                          <span className="font-semibold">{formatPercentage(profile?.engagementRate || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Likes</span>
                          <span className="font-semibold">{formatNumber(profile?.avgLikes || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Posts/Week</span>
                          <span className="font-semibold">{(profile?.postsPerWeek || 0).toFixed(1)}</span>
                        </div>
                        
                        {creator.platform === 'youtube' && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg Views</span>
                            <span className="font-semibold">{formatNumber(profile?.avgViews || 0)}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        asChild
                      >
                        <Link to={`/creator/${creator.platform}/${creator.userId}`}>
                          View Full Report
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Followers vs Engagement Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Followers vs Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={reports?.map(creator => ({
                        name: creator.report?.profile?.username || creator.username,
                        followers: creator.report?.profile?.followers || 0,
                        engagementRate: (creator.report?.profile?.engagementRate || 0) * 100,
                        platform: creator.platform
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'followers' ? formatNumber(value) : `${value.toFixed(2)}%`,
                          name === 'followers' ? 'Followers' : 'Engagement Rate'
                        ]}
                      />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="followers" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart
                      data={reports?.map(creator => ({
                        name: creator.report?.profile?.username || creator.username,
                        followers: Math.min(100, (creator.report?.profile?.followers || 0) / 100000), // Normalize to 0-100
                        engagement: (creator.report?.profile?.engagementRate || 0) * 100,
                        posting: Math.min(100, (creator.report?.profile?.postsPerWeek || 0) * 10),
                        growth: Math.min(100, Math.max(0, ((creator.report?.profile?.growth?.followers30d || 0) + 1) * 50)),
                      }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        dataKey="followers"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.1}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Metric</th>
                        {reports?.map((creator, i) => (
                          <th key={i} className="text-center p-2">
                            @{creator.report?.profile?.username || creator.username}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'followers', label: 'Followers', format: formatNumber },
                        { key: 'engagementRate', label: 'Engagement Rate', format: formatPercentage },
                        { key: 'avgLikes', label: 'Avg Likes', format: formatNumber },
                        { key: 'avgComments', label: 'Avg Comments', format: formatNumber },
                        { key: 'postsPerWeek', label: 'Posts/Week', format: (n: number) => n.toFixed(1) },
                        { key: 'postsCount', label: 'Total Posts', format: formatNumber },
                      ].map((metric) => (
                        <tr key={metric.key} className="border-b">
                          <td className="p-2 font-medium">{metric.label}</td>
                          {reports?.map((creator, i) => {
                            const value = creator.report?.profile?.[metric.key] || 0;
                            const allValues = reports.map(c => c.report?.profile?.[metric.key] || 0);
                            const maxValue = Math.max(...allValues);
                            const isHighest = value === maxValue && value > 0;
                            
                            return (
                              <td key={i} className={`text-center p-2 ${isHighest ? 'font-bold text-primary' : ''}`}>
                                {metric.format(value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
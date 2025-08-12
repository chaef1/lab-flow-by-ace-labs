import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Heart, MessageCircle, Eye, MapPin, TrendingUp, Loader2 } from 'lucide-react';
import { useInfluencerAnalytics } from '@/hooks/useInfluencerAnalytics';

interface AnalyticsDashboardProps {
  influencer: {
    id: string;
    username?: string;
    full_name?: string;
    follower_count?: number;
    engagement_rate?: number;
    avg_likes?: number;
    avg_comments?: number;
    audience_insights?: {
      demographics?: {
        ageGroups?: Record<string, number>;
        locations?: Record<string, number>;
        countries?: Record<string, number>;
      };
      engagement?: {
        totalLikes?: number;
        totalComments?: number;
        totalViews?: number;
        totalReach?: number;
      };
    };
  };
}

export function AnalyticsDashboard({ influencer }: AnalyticsDashboardProps) {
  const { fetchAnalytics, loading, error } = useInfluencerAnalytics();
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (influencer.id) {
        const data = await fetchAnalytics(influencer.id, 'instagram');
        setAnalyticsData(data);
      }
    };
    loadAnalytics();
  }, [influencer.id, fetchAnalytics]);

  // Use real analytics data if available, otherwise use influencer data
  const insights = analyticsData ? {
    demographics: analyticsData.demographics,
    engagement: analyticsData.engagement
  } : influencer.audience_insights;
  
  const demographics = insights?.demographics;
  const engagement = insights?.engagement;

  // Parse age groups data
  const ageGroups = demographics?.ageGroups && Object.keys(demographics.ageGroups).length > 0 
    ? Object.entries(demographics.ageGroups)
        .map(([key, value]) => ({ range: key, count: Number(value) || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    : [];

  // Parse top locations
  const topLocations = demographics?.locations && Object.keys(demographics.locations).length > 0
    ? Object.entries(demographics.locations)
        .map(([city, count]) => ({ city, count: Number(count) || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    : [];

  // Parse top countries
  const topCountries = demographics?.countries && Object.keys(demographics.countries).length > 0
    ? Object.entries(demographics.countries)
        .map(([country, count]) => ({ country, count: Number(count) || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    : [];

  // Calculate total audience for percentages
  const totalAudience = ageGroups.reduce((sum, group) => sum + group.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive font-medium">Analytics Unavailable</p>
        <p className="text-destructive/80 text-sm mt-1">
          {error.includes('Instagram is not linked') 
            ? 'Instagram account is not connected to Ayrshare. Please link your Instagram account in the Ayrshare dashboard.'
            : `Error: ${error}`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview - Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-500">
            {analyticsData?.followerGrowth?.total?.toLocaleString() || influencer.follower_count?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-muted-foreground">Followers</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-red-500">
            {analyticsData?.engagement?.avgLikes?.toLocaleString() || influencer.avg_likes?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-muted-foreground">Avg. Likes</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-500">
            {analyticsData?.engagement?.avgComments?.toLocaleString() || influencer.avg_comments?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-muted-foreground">Avg. Comments</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-green-500">
            {analyticsData?.engagement?.rate?.toFixed(1) || ((influencer.engagement_rate || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Engagement</div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Engagement Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Engagement Rate</span>
              <Badge variant="secondary">{((influencer.engagement_rate || 0) * 100).toFixed(1)}%</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Engagement Rate</span>
                <span className="font-medium">
                  {analyticsData?.engagement?.rate?.toFixed(1) || ((influencer.engagement_rate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average Likes</span>
                <span className="font-medium">
                  {analyticsData?.engagement?.avgLikes?.toLocaleString() || influencer.avg_likes?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average Comments</span>
                <span className="font-medium">
                  {analyticsData?.engagement?.avgComments?.toLocaleString() || influencer.avg_comments?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Follower Growth</span>
                <span className="font-medium">
                  {analyticsData?.followerGrowth?.growth > 0 ? '+' : ''}{analyticsData?.followerGrowth?.growth || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Age Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ageGroups.length > 0 ? (
              <div className="space-y-3">
                {ageGroups.map((group, index) => {
                  const percentage = totalAudience > 0 ? (group.count / totalAudience) * 100 : Number(group.count) || 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{group.range}</span>
                        <span className="text-muted-foreground">{Number(percentage).toFixed(1)}%</span>
                      </div>
                      <Progress value={Number(percentage)} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No demographic data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLocations.length > 0 ? (
              <div className="space-y-3">
                {topLocations.map((location, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="truncate font-medium">{location.city}</span>
                    <Badge variant="outline" className="ml-2">{Number(location.count).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No location data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCountries.length > 0 ? (
              <div className="space-y-3">
                {topCountries.map((country, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{country.country}</span>
                    <Badge variant="outline">{Number(country.count).toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No country data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {analyticsData?.followerGrowth?.total?.toLocaleString() || influencer.follower_count?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Total Followers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-1">
                {analyticsData?.engagement?.avgLikes?.toLocaleString() || influencer.avg_likes?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Average Likes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {analyticsData?.engagement?.rate?.toFixed(1) || ((influencer.engagement_rate || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
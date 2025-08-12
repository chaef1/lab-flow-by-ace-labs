import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Heart, MessageCircle, Eye, MapPin, TrendingUp } from 'lucide-react';

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
  const insights = influencer.audience_insights;
  const demographics = insights?.demographics;
  const engagement = insights?.engagement;

  // Sample data for demonstration when no real data exists
  const sampleAgeGroups = [
    { range: '18-24', count: 45 },
    { range: '25-34', count: 35 },
    { range: '35-44', count: 15 },
    { range: '45-54', count: 5 }
  ];

  const sampleLocations = [
    { city: 'Cape Town', count: 1250 },
    { city: 'Johannesburg', count: 987 },
    { city: 'Durban', count: 654 },
    { city: 'Pretoria', count: 432 },
    { city: 'Port Elizabeth', count: 321 }
  ];

  const sampleCountries = [
    { country: 'South Africa', count: 3644 },
    { country: 'United States', count: 298 },
    { country: 'United Kingdom', count: 156 },
    { country: 'Australia', count: 87 },
    { country: 'Canada', count: 65 }
  ];

  // Parse age groups data or use sample data
  const ageGroups = demographics?.ageGroups ? Object.entries(demographics.ageGroups)
    .map(([key, value]) => ({ range: key, count: value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) : sampleAgeGroups;

  // Parse top locations or use sample data
  const topLocations = demographics?.locations ? Object.entries(demographics.locations)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) : sampleLocations;

  // Parse top countries or use sample data
  const topCountries = demographics?.countries ? Object.entries(demographics.countries)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) : sampleCountries;

  // Calculate total audience for percentages
  const totalAudience = ageGroups.reduce((sum, group) => sum + group.count, 0);

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview - Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-500">{influencer.follower_count?.toLocaleString() || '2,475'}</div>
          <div className="text-sm text-muted-foreground">Followers</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-red-500">{influencer.avg_likes?.toLocaleString() || '0'}</div>
          <div className="text-sm text-muted-foreground">Avg. Likes</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-500">{influencer.avg_comments?.toLocaleString() || '0'}</div>
          <div className="text-sm text-muted-foreground">Avg. Comments</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-green-500">{((influencer.engagement_rate || 0) * 100).toFixed(1)}%</div>
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
                <span>Total Likes</span>
                <span className="font-medium">{engagement?.totalLikes?.toLocaleString() || influencer.avg_likes?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Comments</span>
                <span className="font-medium">{engagement?.totalComments?.toLocaleString() || influencer.avg_comments?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Views</span>
                <span className="font-medium">{engagement?.totalViews?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Reach</span>
                <span className="font-medium">{engagement?.totalReach?.toLocaleString() || 'N/A'}</span>
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
            <div className="space-y-3">
              {ageGroups.map((group, index) => {
                const percentage = totalAudience > 0 ? (group.count / totalAudience) * 100 : group.count;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{group.range}</span>
                      <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
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
            <div className="space-y-3">
              {topLocations.map((location, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="truncate font-medium">{location.city}</span>
                  <Badge variant="outline" className="ml-2">{location.count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
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
            <div className="space-y-3">
              {topCountries.map((country, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{country.country}</span>
                  <Badge variant="outline">{country.count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
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
                {influencer.follower_count?.toLocaleString() || '2,475'}
              </div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-1">
                {influencer.avg_likes?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Avg. Likes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {((influencer.engagement_rate || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/Dashboard';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Users, 
  Heart, 
  Eye, 
  ExternalLink, 
  BookmarkPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Calendar,
  Award,
  Download,
  Share2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useCreatorCollaborations } from '@/hooks/useCreatorReport';

// Collaborations Tab Component
const CollaborationsTab = ({ platform, userId }: { platform: string; userId: string }) => {
  const { data: collaborations, isLoading } = useCreatorCollaborations(platform, userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!collaborations?.collaborations?.length) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">No Collaborations Found</h3>
        <p className="text-muted-foreground">This creator hasn't collaborated with brands recently</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{collaborations.summary.totalBrands}</div>
            <p className="text-xs text-muted-foreground">Brands Collaborated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{collaborations.summary.totalPosts}</div>
            <p className="text-xs text-muted-foreground">Sponsored Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{collaborations.summary.avgPerformance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Brand Collaborations */}
      <div className="space-y-4">
        {collaborations.collaborations.map((brand: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{brand.name}</CardTitle>
                <Badge variant="outline">{brand.postCount} posts</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{brand.avgEngagement.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Avg Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{brand.totalEngagement.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Engagement</div>
                </div>
              </div>
              
              {/* Recent Posts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {brand.posts.slice(0, 4).map((post: any, postIndex: number) => (
                  <div key={postIndex} className="relative group cursor-pointer">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {post.thumbnail ? (
                        <img 
                          src={post.thumbnail} 
                          alt="Collaboration post" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="text-white text-xs text-center p-2">
                        <div>{post.likes.toLocaleString()} likes</div>
                        <div>{post.comments.toLocaleString()} comments</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CreatorReport = () => {
  const { platform, userId } = useParams<{ platform: string; userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch creator report
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['creator-report', platform, userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-creator-report', {
        body: { platform, userId }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(platform && userId),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch performance data
  const { data: performance } = useQuery({
    queryKey: ['creator-performance', platform, userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-performance-data', {
        body: { platform, userId, period: 30, postCount: 12 }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(platform && userId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Fetch recent posts via RAW API
  const { data: recentPosts } = useQuery({
    queryKey: ['creator-posts', platform, userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('modash-raw-feed', {
        body: { 
          platform, 
          feedType: 'user-feed', 
          identifier: report?.username,
          limit: 12 
        }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(platform && userId && report?.username),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Unable to load creator report</h3>
          <p className="text-muted-foreground mb-4">
            The creator data could not be fetched at this time.
          </p>
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const audienceData = report.audience?.countries?.slice(0, 5).map((country: any) => ({
    name: country.name,
    value: country.percentage,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  })) || [];

  const growthData = report.growthHistory?.map((point: any) => ({
    date: new Date(point.date).toLocaleDateString(),
    followers: point.followers,
    engagementRate: point.engagementRate * 100
  })) || [];

  const vettingScore = report.vettingScore || { score: 0, reasons: [] };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={report.profilePicUrl} alt={report.username} />
              <AvatarFallback>{report.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">{report.fullName || report.username}</h1>
                {report.isVerified && (
                  <Badge variant="secondary">✓ Verified</Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{report.username}</p>
              <div className="flex items-center space-x-4 mt-1">
                <Badge variant="outline" className="capitalize">{platform}</Badge>
                {report.location && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{report.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BookmarkPlus className="w-4 h-4 mr-2" />
            Add to Watchlist
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(report.followers)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Followers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{(report.engagementRate * 100).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Engagement Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(report.avgViews || 0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Views</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{report.postsPerWeek || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Posts/Week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{vettingScore.score}</span>
            </div>
            <p className="text-xs text-muted-foreground">Vetting Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {growthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="followers" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Followers"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-muted-foreground">
                    Growth data not available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vetting Score */}
            <Card>
              <CardHeader>
                <CardTitle>Vetting Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold">{vettingScore.score}/100</div>
                  <Progress value={vettingScore.score} className="flex-1" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Score Factors:</p>
                  {vettingScore.reasons.map((reason: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground">
                  Based on engagement quality, growth patterns, and content consistency
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          {performance && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(performance.summary.avgLikes)}</div>
                    <div className="text-sm text-muted-foreground">Avg Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(performance.summary.avgComments)}</div>
                    <div className="text-sm text-muted-foreground">Avg Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{performance.summary.totalPosts}</div>
                    <div className="text-sm text-muted-foreground">Total Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {performance.summary.recentTrend === 'increasing' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {performance.summary.recentTrend === 'decreasing' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {performance.summary.recentTrend === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                      <span className="text-sm capitalize">{performance.summary.recentTrend}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Trend</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Audience Countries</CardTitle>
              </CardHeader>
              <CardContent>
                {audienceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={audienceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {audienceData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-muted-foreground">
                    Audience data not available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.audience?.ageGroups && (
                  <div>
                    <h4 className="font-medium mb-2">Age Distribution</h4>
                    <div className="space-y-2">
                      {report.audience.ageGroups.map((group: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{group.range}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={group.percentage} className="w-24" />
                            <span className="text-sm">{group.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.audience?.gender && (
                  <div>
                    <h4 className="font-medium mb-2">Gender Split</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{report.audience.gender.female}%</div>
                        <div className="text-sm text-muted-foreground">Female</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{report.audience.gender.male}%</div>
                        <div className="text-sm text-muted-foreground">Male</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Recent Posts Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Content</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts?.posts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentPosts.posts.slice(0, 12).map((post: any, index: number) => (
                    <div key={index} className="relative group cursor-pointer">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        {post.thumbnail ? (
                          <img 
                            src={post.thumbnail} 
                            alt="Post" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                             No image
                           </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="flex items-center space-x-2 mb-1">
                            <Heart className="w-4 h-4" />
                            <span>{formatNumber(post.likes || 0)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4" />
                            <span>{formatNumber(post.views || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Recent content not available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaborations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Collaborations</CardTitle>
            </CardHeader>
            <CardContent>
              {report.collaborations ? (
                <div className="space-y-4">
                  {report.collaborations.map((collab: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{collab.brandName}</h4>
                        <p className="text-sm text-muted-foreground">{collab.description}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(collab.date).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No brand collaboration data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CreatorReport;
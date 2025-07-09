import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Heart, MessageCircle, Share, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PostAnalyticsProps {
  timeRange: string;
}

const PostAnalytics = ({ timeRange }: PostAnalyticsProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchPostAnalytics = async () => {
      try {
        const response = await fetch('/api/meta/post-analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ timeRange }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch post analytics: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setPosts(data.posts || []);
        setMetrics(data.metrics || {
          totalPosts: 0,
          avgEngagement: 0,
          totalReach: 0,
          totalImpressions: 0,
          chartData: []
        });
      } catch (error: any) {
        console.error('Post analytics error:', error);
        setPosts([]);
        setMetrics({
          totalPosts: 0,
          avgEngagement: 0,
          totalReach: 0,
          totalImpressions: 0,
          chartData: [],
          error: error.message || "Unable to fetch post analytics. Please check your Meta API connection and Instagram insights permissions."
        });
      }
    };

    fetchPostAnalytics();
  }, [timeRange]);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'default';
      case 'video': return 'secondary';
      case 'carousel': return 'outline';
      default: return 'default';
    }
  };

  if (!metrics) return <div>Loading post analytics...</div>;

  if (metrics.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">API Error - Post Analytics Failed</div>
          <div className="text-muted-foreground max-w-md">{metrics.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{metrics.totalPosts}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                <p className="text-2xl font-bold">{metrics.avgEngagement}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold">{metrics.totalReach.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">{metrics.totalImpressions.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reach Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reach" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts Performance</CardTitle>
          <CardDescription>
            Detailed analytics for individual posts in the selected time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Reach</TableHead>
                <TableHead>Engagement Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{formatDate(post.timestamp)}</TableCell>
                  <TableCell className="max-w-xs truncate">{post.caption}</TableCell>
                  <TableCell>
                    <Badge variant={getPostTypeColor(post.type)}>
                      {post.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      {post.likes.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      {post.comments}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Share className="h-4 w-4 text-green-500" />
                      {post.shares}
                    </div>
                  </TableCell>
                  <TableCell>{post.reach.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={post.engagement_rate > 10 ? 'default' : 'secondary'}>
                      {post.engagement_rate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostAnalytics;
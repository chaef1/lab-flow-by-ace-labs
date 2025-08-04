import { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, MapPin, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface AccountInsightsProps {
  timeRange: string;
}

const AccountInsights = ({ timeRange }: AccountInsightsProps) => {
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchAccountInsights = async () => {
      try {
        // Get user's profile key
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('ayrshare_profile_key')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error('Failed to fetch user profile');
        }

        if (!profile?.ayrshare_profile_key) {
          throw new Error('No Ayrshare account connected. Please connect your social media accounts first.');
        }

        const { data, error } = await supabase.functions.invoke('ayrshare-analytics', {
          body: { 
            action: 'account_insights',
            timeRange: timeRange,
            platform: 'instagram',
            profileKey: profile.ayrshare_profile_key
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to fetch account insights from Ayrshare');
        }

        if (!data.success) {
          throw new Error(data.error || 'Ayrshare API returned an error');
        }

        setInsights(data.data);
      } catch (error: any) {
        console.error('Account insights error:', error);
        setInsights({
          error: error.message || "Unable to fetch account insights from Ayrshare. Please check your Ayrshare API connection."
        });
      }
    };

    fetchAccountInsights();
  }, [timeRange]);

  if (!insights) return <div>Loading account insights...</div>;

  if (insights.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">API Error - Account Insights Failed</div>
          <div className="text-muted-foreground max-w-md">{insights.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Follower Growth Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
                <p className="text-2xl font-bold">{insights.followerGrowth.total.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold text-green-500">+{insights.followerGrowth.growth}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Followers</p>
                <p className="text-2xl font-bold text-blue-500">+{insights.followerGrowth.newFollowers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unfollowers</p>
                <p className="text-2xl font-bold text-red-500">-{insights.followerGrowth.unfollowers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follower Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Follower Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={insights.growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="followers" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={insights.demographics.ageGroups}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {insights.demographics.ageGroups.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={insights.demographics.genders}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {insights.demographics.genders.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Cities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Cities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.demographics.topCities.map((city: any, index: number) => (
              <div key={city.city} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{city.city}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {city.followers.toLocaleString()} followers
                  </span>
                  <div className="w-20">
                    <Progress value={city.percentage} className="h-2" />
                  </div>
                  <span className="text-sm font-medium w-12">{city.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimal Posting Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Best Posting Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={insights.activity.bestPostTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Best Posting Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={insights.activity.bestDays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Hashtags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Performing Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.contentPerformance.topHashtags.map((hashtag: any, index: number) => (
              <div key={hashtag.tag} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{hashtag.tag}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {hashtag.usage} posts
                  </span>
                  <Badge variant={hashtag.engagement > 12 ? 'default' : 'secondary'}>
                    {hashtag.engagement}% engagement
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountInsights;
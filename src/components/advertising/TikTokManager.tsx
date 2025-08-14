import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Heart,
  MessageCircle,
  Share,
  Calendar,
  BarChart3,
  Activity,
  Settings
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TikTokConnectionStatus {
  connected: boolean;
  username?: string;
  profileKey?: string;
  accountInfo?: any;
}

interface TikTokAnalytics {
  followerCount: number;
  videoCount: number;
  likesCount: number;
  viewCount: number;
  engagementRate: number;
  growthData: any[];
}

interface TikTokPost {
  id: string;
  videoUrl: string;
  caption: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
}

interface TikTokComment {
  id: string;
  text: string;
  username: string;
  likeCount: number;
  createdAt: string;
}

export function TikTokManager() {
  const [apiKey, setApiKey] = useState('');
  const [profileKey, setProfileKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showProfileKey, setShowProfileKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<TikTokConnectionStatus>({ connected: false });
  const [analytics, setAnalytics] = useState<TikTokAnalytics | null>(null);
  const [postHistory, setPostHistory] = useState<TikTokPost[]>([]);
  const [comments, setComments] = useState<TikTokComment[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    checkCurrentConnection();
  }, []);

  const checkCurrentConnection = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's profile key from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key')
        .eq('id', user.id)
        .single();

      if (profile?.ayrshare_profile_key) {
        setProfileKey(profile.ayrshare_profile_key);
        await testConnection(undefined, profile.ayrshare_profile_key);
      }
    } catch (error: any) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (testApiKey?: string, testProfileKey?: string) => {
    const keyToUse = testApiKey || apiKey;
    const profileKeyToUse = testProfileKey || profileKey;

    if (!keyToUse && !profileKeyToUse) {
      toast({
        title: "Missing credentials",
        description: "Please provide either an API Key or Profile Key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test connection using /user endpoint
      const { data, error } = await supabase.functions.invoke('ayrshare-tiktok', {
        body: { 
          action: 'test_connection',
          apiKey: keyToUse,
          profileKey: profileKeyToUse
        }
      });

      if (error) throw error;

      if (data.success) {
        const userInfo = data.data;
        const tikTokConnected = userInfo.activeSocialAccounts?.includes('tiktok') || false;
        
        setConnectionStatus({
          connected: tikTokConnected,
          username: userInfo.username,
          profileKey: profileKeyToUse,
          accountInfo: userInfo
        });

        if (tikTokConnected) {
          toast({
            title: "TikTok Connected Successfully",
            description: `Connected to TikTok account: ${userInfo.username || 'Unknown'}`,
          });
          
          // Auto-load analytics and history
          await Promise.all([
            loadAnalytics(profileKeyToUse),
            loadPostHistory(profileKeyToUse)
          ]);
        } else {
          toast({
            title: "TikTok Not Connected",
            description: "Your Ayrshare account is connected but TikTok is not linked. Please link TikTok in your Ayrshare dashboard.",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setConnectionStatus({ connected: false });
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to TikTok via Ayrshare",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredentials = async () => {
    if (!apiKey && !profileKey) {
      toast({
        title: "Missing credentials",
        description: "Please provide either an API Key or Profile Key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save profile key to database if provided
      if (profileKey) {
        const { error } = await supabase
          .from('profiles')
          .update({ ayrshare_profile_key: profileKey })
          .eq('id', user.id);

        if (error) throw error;
      }

      // Test the connection with new credentials
      await testConnection();

      toast({
        title: "Credentials Saved",
        description: "Your Ayrshare credentials have been saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async (profileKeyToUse?: string) => {
    const keyToUse = profileKeyToUse || profileKey;
    if (!keyToUse) return;

    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-tiktok', {
        body: { 
          action: 'get_analytics',
          profileKey: keyToUse,
          platform: 'tiktok',
          timeRange: '30d'
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load TikTok analytics",
        variant: "destructive"
      });
    }
  };

  const loadPostHistory = async (profileKeyToUse?: string) => {
    const keyToUse = profileKeyToUse || profileKey;
    if (!keyToUse) return;

    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-tiktok', {
        body: { 
          action: 'get_history',
          profileKey: keyToUse,
          platform: 'tiktok'
        }
      });

      if (error) throw error;

      if (data.success) {
        setPostHistory(data.data.posts || []);
      }
    } catch (error: any) {
      console.error('Error loading post history:', error);
      toast({
        title: "History Error",
        description: "Failed to load post history",
        variant: "destructive"
      });
    }
  };

  const loadComments = async (postId: string) => {
    if (!profileKey || !postId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-tiktok', {
        body: { 
          action: 'get_comments',
          profileKey: profileKey,
          postId: postId,
          platform: 'tiktok'
        }
      });

      if (error) throw error;

      if (data.success) {
        setComments(data.data.comments || []);
        setSelectedPostId(postId);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast({
        title: "Comments Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="text-sm font-bold">♪</div>
                TikTok Integration via Ayrshare
              </CardTitle>
              <CardDescription>
                Manage your TikTok connection through Ayrshare API
              </CardDescription>
            </div>
            {connectionStatus.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {connectionStatus.connected && connectionStatus.accountInfo && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Connected to TikTok account: <strong>{connectionStatus.username || 'N/A'}</strong>
                <br />
                Active platforms: {connectionStatus.accountInfo.activeSocialAccounts?.join(', ') || 'None'}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div>
              <Label htmlFor="apiKey">Ayrshare API Key (Premium Plans)</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your Ayrshare API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Required for Premium plans. Leave empty if using Profile Key.
              </p>
            </div>

            <div>
              <Label htmlFor="profileKey">Profile Key (Business/Enterprise Plans)</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="profileKey"
                    type={showProfileKey ? "text" : "password"}
                    placeholder="Enter your Ayrshare Profile Key"
                    value={profileKey}
                    onChange={(e) => setProfileKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowProfileKey(!showProfileKey)}
                  >
                    {showProfileKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Required for Business/Enterprise plans with multiple users.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={saveCredentials} 
                disabled={isLoading || (!apiKey && !profileKey)}
                variant="default"
              >
                {isLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                Save & Test Connection
              </Button>
              
              <Button 
                onClick={() => testConnection()} 
                disabled={isLoading || (!apiKey && !profileKey)}
                variant="outline"
              >
                {isLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>
            </div>
          </div>

          {!connectionStatus.connected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>TikTok Account Not Linked:</strong> Please visit your{' '}
                <a 
                  href="https://profile.ayrshare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Ayrshare Dashboard
                </a>{' '}
                to link your TikTok account before using these features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* TikTok Data Dashboard */}
      {connectionStatus.connected && (
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Post History
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>TikTok Analytics</CardTitle>
                  <Button 
                    onClick={() => loadAnalytics()} 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      <Users className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Followers</p>
                        <p className="text-2xl font-bold">{analytics.followerCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      <Activity className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Videos</p>
                        <p className="text-2xl font-bold">{analytics.videoCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      <Heart className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                        <p className="text-2xl font-bold">{analytics.likesCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-muted/50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                        <p className="text-2xl font-bold">{analytics.engagementRate.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No analytics data available</p>
                    <Button 
                      onClick={() => loadAnalytics()} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Load Analytics
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Post History</CardTitle>
                  <Button 
                    onClick={() => loadPostHistory()} 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {postHistory.length > 0 ? (
                  <ScrollArea className="h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Likes</TableHead>
                          <TableHead>Comments</TableHead>
                          <TableHead>Shares</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {postHistory.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="max-w-xs">
                              <p className="truncate">{post.caption || 'No caption'}</p>
                            </TableCell>
                            <TableCell>{post.viewCount?.toLocaleString() || 0}</TableCell>
                            <TableCell>{post.likeCount?.toLocaleString() || 0}</TableCell>
                            <TableCell>{post.commentCount?.toLocaleString() || 0}</TableCell>
                            <TableCell>{post.shareCount?.toLocaleString() || 0}</TableCell>
                            <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                onClick={() => loadComments(post.id)} 
                                variant="outline" 
                                size="sm"
                              >
                                View Comments
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No post history available</p>
                    <Button 
                      onClick={() => loadPostHistory()} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Load Post History
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Comments</CardTitle>
                <CardDescription>
                  {selectedPostId 
                    ? `Showing comments for post: ${selectedPostId}` 
                    : 'Select a post from the History tab to view comments'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comments.length > 0 ? (
                  <ScrollArea className="h-96 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">@{comment.username}</p>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm">{comment.likeCount}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {selectedPostId 
                        ? 'No comments found for this post' 
                        : 'Select a post to view comments'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
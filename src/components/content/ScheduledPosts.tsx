import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trash2, RefreshCw, Instagram, Youtube, Linkedin, Twitter, Facebook } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScheduledPost {
  id: string;
  post: string;
  platforms: string[];
  scheduleDate: string;
  status: 'scheduled' | 'published' | 'failed';
  createdAt: string;
}

export function ScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const platformIcons: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    tiktok: () => <div className="text-xs font-bold">♪</div>
  };

  const platformColors: Record<string, string> = {
    instagram: 'from-purple-500 to-pink-500',
    facebook: 'from-blue-500 to-blue-600',
    twitter: 'from-sky-400 to-blue-500',
    linkedin: 'from-blue-600 to-blue-700',
    youtube: 'from-red-500 to-red-600',
    tiktok: 'from-black to-gray-800'
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-post-schedule', {
        body: { action: 'get_scheduled_posts' }
      });

      if (error) throw error;

      if (data.success && data.data) {
        // Transform Ayrshare response to our format
        const transformedPosts = (data.data.posts || []).map((post: any) => ({
          id: post.id,
          post: post.post,
          platforms: post.platforms || [],
          scheduleDate: post.scheduleDate || post.publishDate,
          status: post.status || 'scheduled',
          createdAt: post.createdAt || new Date().toISOString()
        }));
        
        setPosts(transformedPosts);
      }
    } catch (error: any) {
      console.error('Error fetching scheduled posts:', error);
      toast({
        title: "Failed to fetch scheduled posts",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    setIsDeleting(postId);
    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-post-schedule', {
        body: { 
          action: 'delete_scheduled_post',
          postId 
        }
      });

      if (error) throw error;

      if (data.success) {
        setPosts(posts.filter(post => post.id !== postId));
        toast({
          title: "Post deleted",
          description: "Scheduled post has been deleted successfully"
        });
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Failed to delete post",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-background to-muted/50">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Scheduled Posts
            </CardTitle>
            <CardDescription>
              Manage your scheduled and published posts
            </CardDescription>
          </div>
          <Button onClick={fetchScheduledPosts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No scheduled posts</h3>
            <p className="text-muted-foreground">Schedule your first post to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-2 border-transparent hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Post Content */}
                      <p className="text-sm leading-relaxed line-clamp-3">
                        {post.post}
                      </p>
                      
                      {/* Platforms */}
                      <div className="flex flex-wrap gap-2">
                        {post.platforms.map((platform) => {
                          const Icon = platformIcons[platform];
                          return (
                            <Badge 
                              key={platform}
                              className={`bg-gradient-to-r ${platformColors[platform]} text-white border-0`}
                            >
                              {Icon && <Icon className="h-3 w-3 mr-1" />}
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </Badge>
                          );
                        })}
                      </div>
                      
                      {/* Schedule Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.scheduleDate 
                            ? new Date(post.scheduleDate).toLocaleDateString()
                            : 'Immediate'
                          }
                        </div>
                        {post.scheduleDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(post.scheduleDate).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Status */}
                      <Badge className={getStatusColor(post.status)}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                      
                      {/* Delete Button */}
                      {post.status === 'scheduled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                          disabled={isDeleting === post.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from "@/components/layout/Dashboard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, MessageSquare, Star, FileText } from 'lucide-react';

const InfluencerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: influencer, isLoading, error } = useQuery({
    queryKey: ['influencer', id],
    queryFn: async () => {
      if (!id) throw new Error("Influencer ID is required");
      
      // Join influencers table with profiles to get names and avatar
      const { data, error } = await supabase
        .from('influencers')
        .select(`
          id,
          bio,
          categories,
          follower_count,
          engagement_rate,
          instagram_handle,
          tiktok_handle,
          youtube_handle,
          rate_per_post,
          portfolio_images,
          profiles:id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        first_name: data.profiles?.first_name,
        last_name: data.profiles?.last_name,
        avatar_url: data.profiles?.avatar_url,
        bio: data.bio,
        categories: data.categories,
        follower_count: data.follower_count,
        engagement_rate: data.engagement_rate,
        instagram_handle: data.instagram_handle,
        tiktok_handle: data.tiktok_handle,
        youtube_handle: data.youtube_handle,
        rate_per_post: data.rate_per_post,
        portfolio_images: data.portfolio_images
      };
    },
    enabled: !!id
  });
  
  // Fetch projects to potentially assign this influencer to
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Dashboard>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
        </div>
      </Dashboard>
    );
  }

  if (error || !influencer) {
    return (
      <Dashboard>
        <div className="text-center py-10 text-destructive">
          Error loading influencer. Please try again.
        </div>
      </Dashboard>
    );
  }

  const fullName = `${influencer.first_name || ''} ${influencer.last_name || ''}`.trim();
  
  return (
    <Dashboard title="Influencer Profile" subtitle="View influencer details">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={influencer.avatar_url || undefined} />
                  <AvatarFallback>
                    {influencer.first_name && influencer.last_name 
                      ? `${influencer.first_name[0]}${influencer.last_name[0]}` 
                      : 'IN'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  <div className="flex items-center text-muted-foreground">
                    {influencer.instagram_handle && (
                      <div className="flex items-center">
                        <Instagram size={16} className="mr-1" />
                        @{influencer.instagram_handle}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>
                  <MessageSquare size={16} className="mr-2" />
                  Contact
                </Button>
                <Button variant="outline">
                  <FileText size={16} className="mr-2" />
                  Add to Project
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                    <TabsTrigger value="campaigns">Past Campaigns</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <h2 className="text-xl font-medium">About</h2>
                    <p className="text-muted-foreground">{influencer.bio || 'No bio available'}</p>
                    
                    <div className="mt-4">
                      <h2 className="text-xl font-medium mb-2">Categories</h2>
                      <div className="flex flex-wrap gap-2">
                        {influencer.categories?.map((category, i) => (
                          <Badge key={i} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                        {(!influencer.categories || influencer.categories.length === 0) && (
                          <span className="text-muted-foreground">No categories specified</span>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="portfolio" className="mt-4">
                    <h2 className="text-xl font-medium mb-4">Portfolio</h2>
                    
                    {influencer.portfolio_images && influencer.portfolio_images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {influencer.portfolio_images.map((image, i) => (
                          <div key={i} className="aspect-square rounded-md overflow-hidden">
                            <img 
                              src={image} 
                              alt={`Portfolio item ${i + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        No portfolio images available.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="campaigns" className="mt-4">
                    <h2 className="text-xl font-medium mb-4">Past Campaigns</h2>
                    <div className="text-center py-10 text-muted-foreground">
                      No past campaign data available.
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Stats</CardTitle>
                    <CardDescription>Influencer performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                      <div className="text-xl font-bold">{influencer.follower_count?.toLocaleString() || '0'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                      <div className="flex items-center">
                        <Star className="mr-1 h-4 w-4 text-amber-500" />
                        <span className="text-xl font-bold">{influencer.engagement_rate || '0'}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Rate per Post</div>
                      <div className="text-xl font-bold">
                        ${influencer.rate_per_post?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Add to Project</h3>
                      
                      {projects && projects.length > 0 ? (
                        <div className="space-y-2">
                          {projects.map(project => (
                            <Button key={project.id} variant="outline" className="w-full justify-start">
                              {project.title}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-2 text-sm text-muted-foreground">
                          No projects available.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
};

export default InfluencerProfile;

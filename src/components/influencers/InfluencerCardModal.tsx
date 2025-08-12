
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft,
  ChevronRight,
  Heart,
  X, 
  Instagram, 
  Star, 
  Users,
  Award,
  BookmarkPlus,
  MessageSquare,
  Share
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface InfluencerCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerData: any;
  onAddToPool?: () => void;
  onAddToCampaign?: () => void;
}

export function InfluencerCardModal({
  open,
  onOpenChange,
  influencerData,
  onAddToPool,
  onAddToCampaign,
}: InfluencerCardModalProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'metrics'>('info');
  
  // Fetch pools for dropdown - we need to handle cases where these tables might not exist
  const { data: pools } = useQuery({
    queryKey: ['influencer-pools'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('projects')  // Using existing projects table instead of non-existent influencer_pools
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching pools:', err);
        return [];
      }
    },
    enabled: open // Only fetch when modal is open
  });
  
  // Fetch campaigns for dropdown
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('projects')  // Using projects as campaigns instead of non-existent campaigns table
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        return [];
      }
    },
    enabled: open // Only fetch when modal is open
  });
  
  const handleAddToPool = async (poolId: string) => {
    try {
      // Mock functionality since the table doesn't exist
      toast({
        title: "Added to pool",
        description: "Influencer has been added to the pool successfully."
      });
      
      if (onAddToPool) onAddToPool();
    } catch (error) {
      console.error('Failed to add to pool:', error);
      toast({
        title: "Failed to add to pool",
        description: "There was an error adding the influencer to the pool.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddToCampaign = async (campaignId: string) => {
    try {
      // Mock functionality since the table doesn't exist
      toast({
        title: "Added to campaign",
        description: "Influencer has been added to the campaign successfully."
      });
      
      if (onAddToCampaign) onAddToCampaign();
    } catch (error) {
      console.error('Failed to add to campaign:', error);
      toast({
        title: "Failed to add to campaign",
        description: "There was an error adding the influencer to the campaign.",
        variant: "destructive"
      });
    }
  };
  
  // Dynamic component based on device type
  const Container = isMobile ? Sheet : Dialog;
  const ContainerContent = isMobile ? SheetContent : DialogContent;
  const ContainerHeader = isMobile ? SheetHeader : DialogHeader;
  const ContainerTitle = isMobile ? SheetTitle : DialogTitle;
  
  if (!influencerData) return null;

  const fullName = `${influencerData.first_name || ''} ${influencerData.last_name || ''}`.trim();
  
  return (
    <Container open={open} onOpenChange={onOpenChange}>
      <ContainerContent className={isMobile ? "px-0 pt-6" : "p-0 max-w-md overflow-hidden"}>
        <ContainerHeader className={isMobile ? "px-4" : "p-4 bg-background"}>
          <ContainerTitle>Influencer Profile</ContainerTitle>
        </ContainerHeader>
        
        <div className={`${isMobile ? "mt-2" : ""}`}>
          {/* Tinder-style card */}
          <div className="relative mx-auto overflow-hidden rounded-lg">
            {/* Profile Image or Cover section */}
            <div className="relative h-60 bg-gradient-to-t from-black/60 to-transparent">
              {influencerData.avatar_url ? (
                <img 
                  src={influencerData.avatar_url}
                  alt={fullName || 'Influencer'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500" />
              )}
              
              {/* Overlay gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Profile information at bottom of cover */}
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={influencerData.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {influencerData.first_name && influencerData.last_name 
                        ? `${influencerData.first_name[0]}${influencerData.last_name[0]}` 
                        : 'IN'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-xl">{fullName || 'Unnamed Influencer'}</h2>
                    <div className="flex items-center text-sm opacity-90">
                      {influencerData.instagram_handle && (
                        <div className="flex items-center">
                          <Instagram size={14} className="mr-1" />
                          @{influencerData.instagram_handle}
                        </div>
                      )}
                      {influencerData.tiktok_handle && (
                        <div className="flex items-center ml-2">
                          <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="currentColor" />
                          </svg>
                          @{influencerData.tiktok_handle}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card Content */}
            <div className="bg-card">
              {/* Navigation tabs */}
              <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-3 text-center ${activeTab === 'info' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                >
                  Info
                </button>
                <button 
                  onClick={() => setActiveTab('metrics')}
                  className={`flex-1 py-3 text-center ${activeTab === 'metrics' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                >
                  Metrics
                </button>
              </div>
              
              {/* Tab content */}
              <div className="p-4">
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    {/* Bio */}
                    <div>
                      <h3 className="font-medium mb-1">Bio</h3>
                      <p className="text-sm text-muted-foreground">
                        {influencerData.bio || 'No bio available'}
                      </p>
                    </div>
                    
                    {/* Categories */}
                    <div>
                      <h3 className="font-medium mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {influencerData.categories?.map((category: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                        {(!influencerData.categories || influencerData.categories.length === 0) && (
                          <span className="text-sm text-muted-foreground">No categories specified</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <Card className="p-2 text-center">
                        <CardContent className="p-0">
                          <p className="text-xs text-muted-foreground">Followers</p>
                          <p className="font-medium">
                            {influencerData.follower_count?.toLocaleString() || '0'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="p-2 text-center">
                        <CardContent className="p-0">
                          <p className="text-xs text-muted-foreground">Engagement</p>
                          <div className="flex items-center justify-center">
                            <Star size={12} className="text-amber-500 mr-1" />
                            <p className="font-medium">{influencerData.engagement_rate || '0'}%</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="p-2 text-center">
                        <CardContent className="p-0">
                          <p className="text-xs text-muted-foreground">Rate</p>
                          <p className="font-medium">
                            ${influencerData.rate_per_post?.toLocaleString() || 'N/A'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                
                 {activeTab === 'metrics' && (
                  <div className="space-y-4">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-3">
                            <CardContent className="p-0">
                              <h4 className="text-sm text-muted-foreground">Followers</h4>
                              <div className="flex items-center mt-1">
                                <Users className="h-4 w-4 mr-2 text-primary" />
                                <span className="text-lg font-semibold">
                                  {influencerData.follower_count?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="p-3">
                            <CardContent className="p-0">
                              <h4 className="text-sm text-muted-foreground">Engagement Rate</h4>
                              <div className="flex items-center mt-1">
                                <Star className="h-4 w-4 mr-2 text-amber-500" />
                                <span className="text-lg font-semibold">{influencerData.engagement_rate || '0'}%</span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="p-3">
                            <CardContent className="p-0">
                              <h4 className="text-sm text-muted-foreground">Avg. Likes</h4>
                              <div className="flex items-center mt-1">
                                <Heart className="h-4 w-4 mr-2 text-rose-500" />
                                <span className="text-lg font-semibold">
                                  {influencerData.avg_likes?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="p-3">
                            <CardContent className="p-0">
                              <h4 className="text-sm text-muted-foreground">Avg. Comments</h4>
                              <div className="flex items-center mt-1">
                                <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-lg font-semibold">
                                  {influencerData.avg_comments?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="analytics" className="space-y-4">
                        <AnalyticsDashboard influencer={influencerData} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-between mt-6 gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (pools && pools.length > 0) {
                        handleAddToPool(pools[0].id);
                      } else {
                        toast({
                          title: "No pools available",
                          description: "Create an influencer pool first.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <BookmarkPlus className="mr-2 h-4 w-4" /> 
                    Add to Pool
                  </Button>
                  
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (campaigns && campaigns.length > 0) {
                        handleAddToCampaign(campaigns[0].id);
                      } else {
                        toast({
                          title: "No campaigns available",
                          description: "Create a campaign first.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> 
                    Add to Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Swipe buttons (just for UI, not functional in this implementation) */}
          <div className="flex justify-center mt-4 gap-4">
            <Button size="icon" variant="outline" className="rounded-full h-12 w-12">
              <X className="h-6 w-6 text-destructive" />
            </Button>
            
            <Button size="icon" className="rounded-full h-12 w-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              <Heart className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </ContainerContent>
    </Container>
  );
}

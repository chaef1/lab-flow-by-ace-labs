import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from "@/components/layout/Dashboard";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Instagram, Search, Star, Plus } from 'lucide-react';
import SocialMediaSearch from '@/components/influencers/SocialMediaSearch';
import { InfluencerCardModal } from '@/components/influencers/InfluencerCardModal';

// Interface for influencer data
interface Influencer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  categories: string[] | null;
  follower_count: number | null;
  engagement_rate: number | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
}

const Influencers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [followerCountFilter, setFollowerCountFilter] = useState<string>('all');
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Fetch influencers
  const { data: influencers, isLoading, error, refetch } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      // Join influencers table with profiles to get names and avatar
      const { data, error } = await supabase
        .from('influencers')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `);
      
      if (error) {
        throw error;
      }
      
      // Format the data to match the Influencer interface
      return data?.map(item => ({
        id: item.id,
        first_name: item.profiles?.first_name,
        last_name: item.profiles?.last_name,
        avatar_url: item.profiles?.avatar_url,
        bio: item.bio,
        categories: item.categories,
        follower_count: item.follower_count,
        engagement_rate: item.engagement_rate,
        instagram_handle: item.instagram_handle,
        tiktok_handle: item.tiktok_handle,
        youtube_handle: item.youtube_handle,
      })) as Influencer[];
    }
  });

  // Extract all unique categories
  const allCategories = Array.from(new Set(
    influencers?.flatMap(inf => inf.categories || []) || []
  ));

  // Filter influencers based on search and filters
  const filteredInfluencers = influencers?.filter(inf => {
    // Search filter
    const searchMatch = 
      !searchTerm || 
      `${inf.first_name} ${inf.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inf.bio && inf.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.instagram_handle && inf.instagram_handle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const categoryMatch = 
      categoryFilter === 'all' || 
      (inf.categories && inf.categories.includes(categoryFilter));
    
    // Follower count filter
    let followerMatch = true;
    if (followerCountFilter !== 'all' && inf.follower_count) {
      if (followerCountFilter === 'micro' && (inf.follower_count < 10000 || inf.follower_count > 50000)) {
        followerMatch = false;
      } else if (followerCountFilter === 'mid' && (inf.follower_count < 50000 || inf.follower_count > 500000)) {
        followerMatch = false;
      } else if (followerCountFilter === 'macro' && inf.follower_count < 500000) {
        followerMatch = false;
      }
    }
    
    return searchMatch && categoryMatch && followerMatch;
  });

  const handleAddInfluencer = () => {
    refetch();
    setIsSearchDialogOpen(false);
  };

  const handleCardClick = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setIsCardModalOpen(true);
  };

  return (
    <>
      <Dashboard title="Influencer Directory" subtitle="Find and connect with influencers" showSearch={true}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, bio, or social handle"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={followerCountFilter} onValueChange={setFollowerCountFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Followers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Followers</SelectItem>
                  <SelectItem value="micro">Micro (10K-50K)</SelectItem>
                  <SelectItem value="mid">Mid-tier (50K-500K)</SelectItem>
                  <SelectItem value="macro">Macro (500K+)</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Influencer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Influencer</DialogTitle>
                    <DialogDescription>
                      Search for influencers on social media and add them to your database.
                    </DialogDescription>
                  </DialogHeader>
                  <SocialMediaSearch onAddInfluencer={handleAddInfluencer} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agency-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-destructive">
              Error loading influencers. Please try again.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers?.map((influencer) => (
              <Card 
                key={influencer.id}
                className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(influencer)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={influencer.avatar_url || undefined} />
                    <AvatarFallback>
                      {influencer.first_name && influencer.last_name 
                        ? `${influencer.first_name[0]}${influencer.last_name[0]}` 
                        : 'IN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {influencer.first_name} {influencer.last_name}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {influencer.instagram_handle && (
                        <div className="flex items-center">
                          <Instagram size={14} className="mr-1" />
                          {influencer.instagram_handle}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="flex items-center">
                      <Star size={14} className="mr-1 text-amber-500" />
                      {influencer.engagement_rate || '0'}% Engagement
                    </span>
                    <span className="text-muted-foreground">
                      {influencer.follower_count?.toLocaleString() || '0'} Followers
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {influencer.categories?.slice(0, 3).map((category, i) => (
                      <Badge key={i} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                    {(influencer.categories?.length || 0) > 3 && (
                      <Badge variant="outline">+{(influencer.categories?.length || 0) - 3} more</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {influencer.bio || 'No bio available'}
                  </p>
                </div>
                
                <Button className="w-full mt-4">View Profile</Button>
              </Card>
            ))}
          </div>
          
          {filteredInfluencers?.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">
              No influencers found matching your criteria.
            </div>
          )}
        </div>
      </Dashboard>

      {/* Tinder Card Modal for influencer details */}
      <InfluencerCardModal 
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        influencerData={selectedInfluencer}
        onAddToPool={() => refetch()}
        onAddToCampaign={() => refetch()}
      />
    </>
  );
};

export default Influencers;

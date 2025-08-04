import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from 'lucide-react';
import { InfluencerCard } from './InfluencerCard';
import { InfluencerCardModal } from './InfluencerCardModal';
import { InfluencerPoolDialog } from './InfluencerPoolDialog';
import { InfluencerCampaignDialog } from './InfluencerCampaignDialog';
import { useInfluencerAssignments, InfluencerWithAssignments } from '@/hooks/useInfluencerAssignments';

interface InfluencerListProps {
  onAddInfluencer?: () => void;
}

export function InfluencerList({ onAddInfluencer }: InfluencerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [followerCountFilter, setFollowerCountFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  
  // Modal states
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerWithAssignments | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPoolDialogOpen, setIsPoolDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);

  const {
    influencers,
    availablePools,
    availableCampaigns,
    isLoading,
    error,
    addToPool,
    removeFromPool,
    addToCampaign,
    removeFromCampaign,
    createPool,
    createCampaign,
    refetch
  } = useInfluencerAssignments();

  // Extract all unique categories and platforms
  const allCategories = Array.from(new Set(
    influencers.flatMap(inf => inf.categories || [])
  ));
  
  const allPlatforms = Array.from(new Set(
    influencers.map(inf => inf.platform)
  ));

  // Filter influencers based on search and filters
  const filteredInfluencers = influencers.filter(inf => {
    // Search filter
    const searchMatch = 
      !searchTerm || 
      (inf.full_name && inf.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.username && inf.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.bio && inf.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.instagram_handle && inf.instagram_handle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const categoryMatch = 
      categoryFilter === 'all' || 
      (inf.categories && inf.categories.includes(categoryFilter));
    
    // Platform filter
    const platformMatch = 
      platformFilter === 'all' || 
      inf.platform === platformFilter;
    
    // Follower count filter
    let followerMatch = true;
    if (followerCountFilter !== 'all' && inf.follower_count) {
      const followers = inf.follower_count;
      switch (followerCountFilter) {
        case 'nano':
          followerMatch = followers >= 1000 && followers <= 10000;
          break;
        case 'micro':
          followerMatch = followers >= 10001 && followers <= 50000;
          break;
        case 'mid':
          followerMatch = followers >= 50001 && followers <= 100000;
          break;
        case 'macro':
          followerMatch = followers >= 100001 && followers < 1000000;
          break;
        case 'celebrity':
          followerMatch = followers >= 1000000;
          break;
        default:
          followerMatch = true;
      }
    }
    
    return searchMatch && categoryMatch && platformMatch && followerMatch;
  });

  const handleViewProfile = (influencer: InfluencerWithAssignments) => {
    setSelectedInfluencer(influencer);
    setIsCardModalOpen(true);
  };

  const handleAddToPool = (influencer: InfluencerWithAssignments) => {
    setSelectedInfluencer(influencer);
    setIsPoolDialogOpen(true);
  };

  const handleAddToCampaign = (influencer: InfluencerWithAssignments) => {
    setSelectedInfluencer(influencer);
    setIsCampaignDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Error loading influencers. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
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

        <div className="flex gap-2 flex-wrap">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {allPlatforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Followers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Followers</SelectItem>
              <SelectItem value="nano">Nano (1K-10K)</SelectItem>
              <SelectItem value="micro">Micro (10K-50K)</SelectItem>
              <SelectItem value="mid">Mid-Tier (50K-100K)</SelectItem>
              <SelectItem value="macro">Macro (100K-1M)</SelectItem>
              <SelectItem value="celebrity">Celebrity/Elite (1M+)</SelectItem>
            </SelectContent>
          </Select>

          {onAddInfluencer && (
            <Button onClick={onAddInfluencer}>
              <Plus className="mr-2 h-4 w-4" /> 
              Add Influencer
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredInfluencers.length} of {influencers.length} influencers
      </div>

      {/* Influencer grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInfluencers.map((influencer) => (
          <InfluencerCard
            key={influencer.id}
            influencer={influencer}
            campaigns={influencer.campaigns}
            pools={influencer.pools}
            onViewProfile={handleViewProfile}
            onAddToPool={handleAddToPool}
            onAddToCampaign={handleAddToCampaign}
          />
        ))}
      </div>
      
      {filteredInfluencers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No influencers found matching your criteria.
        </div>
      )}

      {/* Modals */}
      <InfluencerCardModal 
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        influencerData={selectedInfluencer}
        onAddToPool={() => {
          setIsCardModalOpen(false);
          setIsPoolDialogOpen(true);
        }}
        onAddToCampaign={() => {
          setIsCardModalOpen(false);
          setIsCampaignDialogOpen(true);
        }}
      />

      <InfluencerPoolDialog
        open={isPoolDialogOpen}
        onOpenChange={setIsPoolDialogOpen}
        influencer={selectedInfluencer}
        availablePools={availablePools}
        onAddToPool={addToPool}
        onRemoveFromPool={removeFromPool}
        onCreatePool={createPool}
      />

      <InfluencerCampaignDialog
        open={isCampaignDialogOpen}
        onOpenChange={setIsCampaignDialogOpen}
        influencer={selectedInfluencer}
        availableCampaigns={availableCampaigns}
        onAddToCampaign={addToCampaign}
        onRemoveFromCampaign={removeFromCampaign}
        onCreateCampaign={createCampaign}
      />
    </div>
  );
}
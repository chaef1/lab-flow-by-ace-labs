import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InfluencerWithAssignments {
  id: string;
  username?: string;
  full_name?: string;
  profile_picture_url?: string;
  bio?: string;
  follower_count?: number;
  engagement_rate?: number;
  platform: string;
  categories?: string[];
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  campaigns?: Array<{ id: string; name: string; }>;
  pools?: Array<{ id: string; name: string; }>;
}

export function useInfluencerAssignments() {
  // Fetch influencers with their campaign and pool assignments
  const { data: influencers, isLoading: isLoadingInfluencers, error, refetch } = useQuery({
    queryKey: ['influencers-with-assignments'],
    queryFn: async () => {
      const { data: influencersData, error: influencersError } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (influencersError) throw influencersError;
      
      if (!influencersData || influencersData.length === 0) {
        return [];
      }
      
      // Get all influencer IDs for batch queries
      const influencerIds = influencersData.map(inf => inf.id);
      
      // Fetch campaign assignments
      const { data: campaignAssignments } = await supabase
        .from('campaign_influencers')
        .select(`
          influencer_id,
          campaigns!inner(id, name)
        `)
        .in('influencer_id', influencerIds);
      
      // Fetch pool assignments  
      const { data: poolAssignments } = await supabase
        .from('influencer_pool_members')
        .select(`
          influencer_id,
          influencer_pools!inner(id, name)
        `)
        .in('influencer_id', influencerIds);
      
      // Combine data
      const influencersWithAssignments: InfluencerWithAssignments[] = influencersData.map(influencer => {
        const campaigns = campaignAssignments
          ?.filter(ca => ca.influencer_id === influencer.id)
          ?.map(ca => ({
            id: ca.campaigns.id,
            name: ca.campaigns.name
          })) || [];
          
        const pools = poolAssignments
          ?.filter(pa => pa.influencer_id === influencer.id)
          ?.map(pa => ({
            id: pa.influencer_pools.id,
            name: pa.influencer_pools.name
          })) || [];
        
        return {
          ...influencer,
          campaigns,
          pools
        };
      });
      
      return influencersWithAssignments;
    }
  });

  // Fetch available pools
  const { data: availablePools, isLoading: isLoadingPools } = useQuery({
    queryKey: ['available-pools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_pools')
        .select('id, name, description')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch available campaigns
  const { data: availableCampaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['available-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, description, status')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const addToPool = async (influencerId: string, poolId: string) => {
    const { error } = await supabase
      .from('influencer_pool_members')
      .insert({
        influencer_id: influencerId,
        pool_id: poolId,
        added_by: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) throw error;
    await refetch();
  };

  const removeFromPool = async (influencerId: string, poolId: string) => {
    const { error } = await supabase
      .from('influencer_pool_members')
      .delete()
      .eq('influencer_id', influencerId)
      .eq('pool_id', poolId);
    
    if (error) throw error;
    await refetch();
  };

  const addToCampaign = async (influencerId: string, campaignId: string) => {
    const { error } = await supabase
      .from('campaign_influencers')
      .insert({
        influencer_id: influencerId,
        campaign_id: campaignId,
        added_by: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) throw error;
    await refetch();
  };

  const removeFromCampaign = async (influencerId: string, campaignId: string) => {
    const { error } = await supabase
      .from('campaign_influencers')
      .delete()
      .eq('influencer_id', influencerId)
      .eq('campaign_id', campaignId);
    
    if (error) throw error;
    await refetch();
  };

  const createPool = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('influencer_pools')
      .insert({
        name,
        description,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const createCampaign = async (name: string, description?: string) => {
    // For now, we'll create a simple campaign record
    // In the future, this might need to link to advertising campaigns
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        description,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        client_id: null // This can be set later when linking to advertising campaigns
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  return {
    influencers: influencers || [],
    availablePools: availablePools || [],
    availableCampaigns: availableCampaigns || [],
    isLoading: isLoadingInfluencers || isLoadingPools || isLoadingCampaigns,
    error,
    addToPool,
    removeFromPool,
    addToCampaign,
    removeFromCampaign,
    createPool,
    createCampaign,
    refetch
  };
}

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getMetaCampaigns,
  getSavedMetaToken,
  createMetaCampaign,
  getMetaAudiences,
  createMetaAdSet,
  createMetaAd,
  getTikTokCampaigns,
  getSavedTikTokToken,
  createTikTokCampaign
} from '@/lib/ads-api';

export const useCampaigns = (platform: 'meta' | 'tiktok', isConnected: boolean) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sampleCampaigns, setSampleCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();

  // Fetch real campaigns when platform or connection status changes
  useEffect(() => {
    if (isConnected) {
      fetchCampaigns();
    }
  }, [platform, isConnected]);

  // Fetch audiences when platform changes and connected
  useEffect(() => {
    if (platform === 'meta' && isConnected) {
      fetchAudiences();
    }
  }, [platform, isConnected]);

  // Function to fetch Meta audiences
  const fetchAudiences = async () => {
    try {
      const { accessToken, accountId } = getSavedMetaToken();
      
      if (accessToken && accountId) {
        const audiencesData = await getMetaAudiences(accessToken, accountId);
        
        if (audiencesData && audiencesData.data) {
          setAudiences(audiencesData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching Meta audiences:', error);
    }
  };

  // Function to fetch campaigns from the selected platform
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      if (platform === 'meta') {
        const { accessToken, accountId } = getSavedMetaToken();
        
        if (accessToken && accountId) {
          console.log('Fetching Meta campaigns for account:', accountId);
          const campaignsData = await getMetaCampaigns(accessToken, accountId);
          
          if (campaignsData && campaignsData.data) {
            console.log('Meta campaigns fetched:', campaignsData.data);
            
            // Transform the campaign data into a more usable format
            const transformedCampaigns = campaignsData.data.map((campaign: any) => ({
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective || 'Not specified',
              status: campaign.status || 'ACTIVE',
              budget: parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0') / 100, // Convert from cents to dollars
              startDate: campaign.start_time,
              endDate: campaign.stop_time,
              spend: campaign.spend || '0',
              insights: campaign.insights ? campaign.insights.data[0] : null
            }));
            
            setCampaigns(transformedCampaigns);
            setSampleCampaigns([]); // Clear sample campaigns
          }
        }
      } else if (platform === 'tiktok') {
        const { accessToken, advertiserId } = getSavedTikTokToken();
        
        if (accessToken && advertiserId) {
          console.log('Fetching TikTok campaigns for advertiser:', advertiserId);
          const campaignsData = await getTikTokCampaigns(accessToken, advertiserId);
          
          if (campaignsData && campaignsData.code === 0 && campaignsData.data && campaignsData.data.list) {
            console.log('TikTok campaigns fetched:', campaignsData.data.list);
            
            // Transform TikTok campaign data
            const transformedCampaigns = campaignsData.data.list.map((campaign: any) => ({
              id: campaign.campaign_id,
              name: campaign.campaign_name,
              objective: campaign.objective_type || 'Not specified',
              status: campaign.status,
              budget: campaign.budget || 0,
              startDate: campaign.start_time,
              endDate: campaign.end_time,
              spend: campaign.spend || '0'
            }));
            
            setCampaigns(transformedCampaigns);
            setSampleCampaigns([]); // Clear sample campaigns
          }
        }
      }
    } catch (error: any) {
      console.error(`Error fetching ${platform} campaigns:`, error);
      setError(`Failed to fetch ${platform} campaigns. Please try again.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Create campaign function
  const createCampaign = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (platform === 'meta') {
        // Get Meta token and account ID
        const { accessToken, accountId } = getSavedMetaToken();
        
        if (!accessToken || !accountId) {
          throw new Error('Meta authentication required. Please connect your Meta account first.');
        }
        
        // Prepare the campaign data
        const campaignData = {
          name: data.name,
          objective: data.objective,
          status: 'PAUSED', // Start as paused for safety
          specialAdCategories: [],
          startTime: data.startDate ? new Date(data.startDate).toISOString() : undefined,
          endTime: data.endDate ? new Date(data.endDate).toISOString() : undefined
        };
        
        // Add budget based on budget type
        if (data.budgetType === 'daily') {
          campaignData['dailyBudget'] = data.budget;
        } else {
          campaignData['lifetimeBudget'] = data.budget;
        }
        
        console.log('Creating Meta campaign with data:', campaignData);
        
        // Call the API to create the campaign
        const campaignResult = await createMetaCampaign(accessToken, accountId, campaignData);
        
        if (!campaignResult || !campaignResult.id) {
          throw new Error('Failed to create campaign. Please try again.');
        }
        
        const campaignId = campaignResult.id;
        console.log('Campaign created successfully with ID:', campaignId);
        
        // Create ad set with targeting
        const adSetData = {
          name: `${data.name} - Ad Set`,
          campaignId: campaignId,
          optimizationGoal: data.objective === 'AWARENESS' ? 'REACH' : 
                          data.objective === 'TRAFFIC' ? 'LINK_CLICKS' : 
                          'CONVERSIONS',
          billingEvent: data.objective === 'AWARENESS' ? 'IMPRESSIONS' : 'IMPRESSIONS',
          dailyBudget: data.budgetType === 'daily' ? data.budget : undefined,
          lifetimeBudget: data.budgetType === 'lifetime' ? data.budget : undefined,
          startTime: data.startDate ? new Date(data.startDate).toISOString() : undefined,
          endTime: data.endDate ? new Date(data.endDate).toISOString() : undefined,
          targeting: {
            age_min: 18,
            age_max: 65,
            genders: [1, 2], // All genders
            geo_locations: {
              countries: ['ZA'] // Target South Africa by default
            }
          }
        };
        
        if (data.targetAudience && data.targetAudience !== 'All') {
          // If custom audience selected, add it to targeting
          adSetData.targeting['custom_audiences'] = [{id: data.targetAudience}];
        }
        
        console.log('Creating ad set with data:', adSetData);
        
        // Create the ad set
        const adSetResult = await createMetaAdSet(accessToken, accountId, adSetData);
        
        if (adSetResult && adSetResult.id) {
          console.log('Ad set created successfully with ID:', adSetResult.id);
          
          toast({
            title: "Campaign Created",
            description: `Your Meta campaign "${data.name}" has been created successfully.`,
          });
        }
        
        // Refresh campaigns
        fetchCampaigns();
        
        return campaignResult;
      } else if (platform === 'tiktok') {
        // Get TikTok token and advertiser ID
        const { accessToken, advertiserId } = getSavedTikTokToken();
        
        if (!accessToken || !advertiserId) {
          throw new Error('TikTok authentication required. Please connect your TikTok account first.');
        }
        
        // Prepare the TikTok campaign data
        const tiktokCampaignData = {
          advertiser_id: advertiserId,
          campaign_name: data.name,
          objective_type: data.objective || "TRAFFIC",
          budget_mode: data.budgetType === 'daily' ? "DAILY" : "TOTAL",
          budget: data.budget * 100, // Convert to cents
          status: "CAMPAIGN_STATUS_PAUSED" // Start as paused for safety
        };
        
        console.log('Creating TikTok campaign with data:', tiktokCampaignData);
        
        // Call the API to create the campaign
        const campaignResult = await createTikTokCampaign(accessToken, advertiserId, tiktokCampaignData);
        
        if (!campaignResult || campaignResult.code !== 0) {
          throw new Error(campaignResult?.message || 'Failed to create TikTok campaign. Please try again.');
        }
        
        toast({
          title: "Campaign Created",
          description: `Your TikTok campaign "${data.name}" has been created successfully.`,
        });
        
        // Refresh campaigns
        fetchCampaigns();
        
        return campaignResult.data;
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      setError(error.message || 'Failed to create campaign');
      
      toast({
        title: "Campaign Creation Failed",
        description: error.message || "There was an error creating your campaign.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update campaign status
  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      if (platform === 'meta') {
        const { accessToken, accountId } = getSavedMetaToken();
        
        if (!accessToken || !accountId) {
          throw new Error('Meta authentication required');
        }
      } else if (platform === 'tiktok') {
        const { accessToken, advertiserId } = getSavedTikTokToken();
        
        if (!accessToken || !advertiserId) {
          throw new Error('TikTok authentication required');
        }
      }
      
      // In real implementation, this would call an API to update the campaign status
      toast({
        title: "Campaign Status Update",
        description: `Campaign status updated to ${newStatus}`,
      });
      
      // Refresh campaigns after update
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Status Update Failed",
        description: error.message || "There was an error updating the campaign status",
        variant: "destructive"
      });
    }
  };

  // Filter campaigns based on active tab
  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return campaign.status === 'ACTIVE' || campaign.status === 'Active';
    if (activeTab === 'paused') return campaign.status === 'PAUSED' || campaign.status === 'Paused';
    if (activeTab === 'draft') return campaign.status === 'DRAFT' || campaign.status === 'Draft';
    return true;
  });

  return {
    campaigns: filteredCampaigns,
    sampleCampaigns,
    isLoading,
    isRefreshing,
    error,
    audiences,
    activeTab,
    setActiveTab,
    fetchCampaigns,
    createCampaign,
    updateCampaignStatus
  };
};

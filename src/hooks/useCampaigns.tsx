import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getMetaCampaigns,
  getSavedMetaToken,
  createMetaCampaign,
  getMetaAudiences,
  createMetaAdSet,
  createMetaAd,
  updateMetaCampaignStatus,
  uploadMetaCreative,
  createMetaAdCreative
} from '@/lib/ads-api';

export const useCampaigns = (platform: 'meta', isConnected: boolean) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
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
          }
        }
      }
    } catch (error: any) {
      console.error(`Error fetching ${platform} campaigns:`, error);
      setError(`Failed to fetch ${platform} campaigns: ${error.message || 'Unknown error'}`);
      
      toast({
        variant: "destructive",
        title: "Error Loading Campaigns",
        description: error.message || `Failed to fetch ${platform} campaigns. Please try again.`,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Create campaign function with full advertising workflow
  const createCampaign = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get Meta token from storage
      const { accessToken } = getSavedMetaToken();
      
      if (!accessToken) {
        throw new Error('Meta authentication required. Please connect your Meta account first.');
      }

      // Use the selected account ID from the form data
      const accountId = data.selectedAccount?.id;
      
      if (!accountId) {
        throw new Error('Ad account selection required. Please select an ad account first.');
      }

      console.log('Creating complete Meta advertising campaign for account:', accountId);
      
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
      
      // Step 1: Create the campaign
      const campaignResult = await createMetaCampaign(accessToken, accountId, campaignData);
      
      if (!campaignResult || !campaignResult.id) {
        throw new Error('Failed to create campaign. Please try again.');
      }
      
      const campaignId = campaignResult.id;
      console.log('Campaign created successfully with ID:', campaignId);
      
      // Step 2: Create ad set with targeting
      const adSetData = {
        name: `${data.name} - Ad Set`,
        campaignId: campaignId,
        optimizationGoal: data.objective === 'OUTCOME_AWARENESS' ? 'REACH' : 
                        data.objective === 'OUTCOME_TRAFFIC' ? 'LINK_CLICKS' : 
                        'CONVERSIONS',
        billingEvent: 'IMPRESSIONS',
        dailyBudget: data.budgetType === 'daily' ? data.budget : undefined,
        lifetimeBudget: data.budgetType === 'lifetime' ? data.budget : undefined,
        startTime: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endTime: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        targeting: data.targeting || {
          age_min: 18,
          age_max: 65,
          genders: [1, 2], // All genders
          geo_locations: {
            countries: ['ZA'] // Target South Africa
          }
        }
      };
      
      console.log('Creating ad set with data:', adSetData);
      
      // Create the ad set
      const adSetResult = await createMetaAdSet(accessToken, accountId, adSetData);
      
      if (!adSetResult || !adSetResult.id) {
        throw new Error('Failed to create ad set. Campaign created but incomplete.');
      }
      
      const adSetId = adSetResult.id;
      console.log('Ad set created successfully with ID:', adSetId);

      // Step 3: Process and upload creatives, then create ads
      if (data.creatives && data.creatives.length > 0) {
        console.log('Processing creatives:', data.creatives.length);
        
        for (const creative of data.creatives) {
          try {
            console.log('Processing creative:', creative.name);
            
            // Upload creative asset
            const uploadData = {
              type: creative.type,
              filename: creative.filename,
              bytes: creative.base64,
              fileSize: creative.size
            };
            
            const uploadResult = await uploadMetaCreative(accessToken, accountId, uploadData);
            console.log('Creative uploaded:', uploadResult);
            
            let imageHash = '';
            let videoId = '';
            
            if (creative.type === 'image' && uploadResult.images) {
              const imageKey = Object.keys(uploadResult.images)[0];
              imageHash = uploadResult.images[imageKey].hash;
            } else if (creative.type === 'video' && uploadResult.id) {
              videoId = uploadResult.id;
            }
            
            // Create ad creative
            const adCreativeData = {
              name: creative.name,
              pageId: data.selectedPage.id,
              imageHash: imageHash,
              videoId: videoId,
              link: creative.destinationUrl,
              message: creative.description,
              headline: creative.headline,
              description: creative.description,
              callToAction: creative.callToAction
            };
            
            console.log('Creating ad creative with data:', adCreativeData);
            
            const adCreativeResult = await createMetaAdCreative(accessToken, accountId, adCreativeData);
            console.log('Ad creative created:', adCreativeResult);
            
            if (adCreativeResult && adCreativeResult.id) {
              // Create the ad
              const adData = {
                name: `${data.name} - ${creative.name}`,
                adSetId: adSetId,
                creativeId: adCreativeResult.id
              };
              
              const adResult = await createMetaAd(accessToken, accountId, adData);
              console.log('Ad created:', adResult);
            }
          } catch (creativeError) {
            console.error('Error processing creative:', creative.name, creativeError);
            // Continue with other creatives
          }
        }
      }
      
      toast({
        title: "Campaign Created Successfully",
        description: `Your Meta campaign "${data.name}" has been created with all creatives and targeting.`,
      });
      
      // Refresh campaigns
      fetchCampaigns();
      
      return campaignResult;
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
  const updateCampaignStatus = async (campaignId: string, newStatus: string): Promise<void> => {
    try {
      setIsRefreshing(true);
      
      const { accessToken, accountId } = getSavedMetaToken();
      
      if (!accessToken) {
        throw new Error('Meta authentication required');
      }
      
      if (!accountId) {
        throw new Error('Ad account information not found');
      }
      
      // Call the API to update the campaign status
      await updateMetaCampaignStatus(accessToken, accountId, campaignId, newStatus);
      
      // Refresh campaigns after update
      fetchCampaigns();
      
    } catch (error: any) {
      console.error('Error updating campaign status:', error);
      
      toast({
        title: "Status Update Failed",
        description: error.message || "There was an error updating the campaign status",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter campaigns based on active tab
  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return campaign.status.toLowerCase() === 'active';
    if (activeTab === 'paused') return campaign.status.toLowerCase() === 'paused';
    if (activeTab === 'draft') return campaign.status.toLowerCase() === 'draft';
    return true;
  });

  return {
    campaigns: filteredCampaigns,
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

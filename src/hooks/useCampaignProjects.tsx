
import { useState } from 'react';
import { CampaignProject, shouldAutoComplete } from '@/lib/campaign-utils';

// Sample data for demonstration
const sampleCampaigns: CampaignProject[] = [
  {
    id: 'campaign-1',
    clientName: 'Tech Corp',
    campaignName: 'Product Launch Campaign',
    elements: ['video', 'design', 'influencers'],
    startDate: '2024-07-01',
    endDate: '2024-08-15',
    budget: 150000,
    campaignOwner: 'John Smith',
    status: 'in-progress',
    tasks: [],
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-18T14:30:00Z'
  },
  {
    id: 'campaign-2',
    clientName: 'Fashion Brand',
    campaignName: 'Summer Collection',
    elements: ['design', 'influencers'],
    startDate: '2024-06-20',
    endDate: '2024-07-31',
    budget: 80000,
    campaignOwner: 'Sarah Johnson',
    status: 'briefed',
    tasks: [],
    createdAt: '2024-06-10T09:00:00Z',
    updatedAt: '2024-06-18T11:00:00Z'
  }
];

export const useCampaignProjects = () => {
  const [campaigns, setCampaigns] = useState<CampaignProject[]>(sampleCampaigns);

  const createCampaign = (campaign: CampaignProject) => {
    setCampaigns(prev => [...prev, campaign]);
  };

  const updateCampaign = (updatedCampaign: CampaignProject) => {
    // Check if campaign should auto-complete
    const shouldComplete = shouldAutoComplete(updatedCampaign);
    if (shouldComplete && updatedCampaign.status !== 'complete') {
      updatedCampaign.status = 'complete';
    }

    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === updatedCampaign.id 
          ? { ...updatedCampaign, updatedAt: new Date().toISOString() }
          : campaign
      )
    );
  };

  const deleteCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
  };

  const getCampaignById = (campaignId: string) => {
    return campaigns.find(campaign => campaign.id === campaignId);
  };

  return {
    campaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignById
  };
};


import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import CampaignList from './campaigns/CampaignList';
import CampaignFilters from './campaigns/CampaignFilters';
import CreateCampaignDialog from './campaigns/CreateCampaignDialog';
import { useCampaigns } from '@/hooks/useCampaigns';

interface CampaignCreatorProps {
  isConnected?: boolean;
  platform?: 'meta'; // Only Meta platform supported now
}

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ 
  isConnected = false,
  platform = 'meta' // Default to Meta
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const {
    campaigns,
    isLoading,
    isRefreshing,
    error,
    audiences,
    activeTab,
    setActiveTab,
    fetchCampaigns,
    createCampaign,
    updateCampaignStatus
  } = useCampaigns(platform, isConnected);

  const handleCreateCampaign = async (data: any) => {
    try {
      await createCampaign(data);
      setIsDialogOpen(false);
    } catch (error) {
      // Error is already handled in the hook
      console.error('Campaign creation error:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Campaign filtering and management */}
      {isConnected && (
        <CampaignFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={fetchCampaigns}
          isRefreshing={isRefreshing}
        />
      )}
      
      {/* Campaign List Section */}
      <CampaignList
        campaigns={campaigns}
        platform={platform}
        onUpdateStatus={updateCampaignStatus}
        isConnected={isConnected}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
      />
      
      {/* Create Campaign Button/Dialog */}
      {isConnected && (
        <div className="flex justify-center mt-4">
          <CreateCampaignDialog
            platform={platform}
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            onCreateCampaign={handleCreateCampaign}
            isLoading={isLoading}
            audiences={audiences}
          />
        </div>
      )}
    </div>
  );
};

export default CampaignCreator;

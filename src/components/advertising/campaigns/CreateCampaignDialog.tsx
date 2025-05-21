
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CampaignForm from './CampaignForm';

interface CreateCampaignDialogProps {
  platform: 'tiktok' | 'meta';
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCreateCampaign: (data: any) => Promise<void>;
  isLoading: boolean;
  audiences?: any[];
}

const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
  platform,
  isOpen,
  setIsOpen,
  onCreateCampaign,
  isLoading,
  audiences = []
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create New Campaign</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New {platform === 'meta' ? 'Meta' : 'TikTok'} Campaign</DialogTitle>
          <DialogDescription>
            Set up your advertising campaign for {platform === 'meta' ? 'Facebook/Instagram' : 'TikTok'}
          </DialogDescription>
        </DialogHeader>
        
        <CampaignForm
          platform={platform}
          onSubmit={onCreateCampaign}
          isLoading={isLoading}
          onCancel={() => setIsOpen(false)}
          audiences={audiences}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;

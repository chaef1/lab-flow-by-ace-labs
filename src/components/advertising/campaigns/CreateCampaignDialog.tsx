
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import CampaignForm from "./CampaignForm";

interface CreateCampaignDialogProps {
  platform: 'meta';
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCreateCampaign: (data: any) => void;
  isLoading: boolean;
  audiences?: any[];
}

const CreateCampaignDialog = ({
  platform,
  isOpen,
  setIsOpen,
  onCreateCampaign,
  isLoading,
  audiences = []
}: CreateCampaignDialogProps) => {
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new {platform === 'meta' ? 'Meta' : 'TikTok'} advertising campaign
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-10rem)] pr-4">
            <CampaignForm
              platform={platform}
              onSubmit={onCreateCampaign}
              isLoading={isLoading}
              onCancel={() => setIsOpen(false)}
              audiences={audiences}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateCampaignDialog;

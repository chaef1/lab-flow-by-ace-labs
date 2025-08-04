import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from 'lucide-react';

interface InfluencerCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer: {
    id: string;
    username?: string;
    full_name?: string;
    campaigns?: Array<{ id: string; name: string; }>;
  } | null;
  availableCampaigns: Array<{ id: string; name: string; description?: string; status?: string; }>;
  onAddToCampaign: (influencerId: string, campaignId: string) => Promise<void>;
  onRemoveFromCampaign: (influencerId: string, campaignId: string) => Promise<void>;
  onCreateCampaign: (name: string, description?: string) => Promise<any>;
}

export function InfluencerCampaignDialog({
  open,
  onOpenChange,
  influencer,
  availableCampaigns,
  onAddToCampaign,
  onRemoveFromCampaign,
  onCreateCampaign
}: InfluencerCampaignDialogProps) {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!influencer) return null;

  const displayName = influencer.full_name || influencer.username || 'Unknown';
  const currentCampaigns = influencer.campaigns || [];
  const availableCampaignsForAssignment = availableCampaigns.filter(
    campaign => !currentCampaigns.some(cc => cc.id === campaign.id)
  );

  const handleAddToCampaign = async () => {
    if (!selectedCampaignId) return;
    
    setIsLoading(true);
    try {
      await onAddToCampaign(influencer.id, selectedCampaignId);
      setSelectedCampaignId('');
      toast({
        title: "Added to campaign",
        description: "Influencer has been added to the campaign successfully."
      });
    } catch (error) {
      console.error('Error adding to campaign:', error);
      toast({
        title: "Error",
        description: "Failed to add influencer to campaign.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCampaign = async (campaignId: string) => {
    setIsLoading(true);
    try {
      await onRemoveFromCampaign(influencer.id, campaignId);
      toast({
        title: "Removed from campaign",
        description: "Influencer has been removed from the campaign."
      });
    } catch (error) {
      console.error('Error removing from campaign:', error);
      toast({
        title: "Error",
        description: "Failed to remove influencer from campaign.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    
    setIsLoading(true);
    try {
      const newCampaign = await onCreateCampaign(newCampaignName.trim(), newCampaignDescription.trim());
      setNewCampaignName('');
      setNewCampaignDescription('');
      setIsCreatingCampaign(false);
      toast({
        title: "Campaign created",
        description: "New campaign has been created successfully."
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Campaign Assignments</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Influencer: {displayName}</h3>
          </div>

          {/* Current campaigns */}
          <div>
            <Label className="text-sm font-medium">Current Campaigns</Label>
            {currentCampaigns.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentCampaigns.map(campaign => (
                  <Badge key={campaign.id} variant="default" className="pr-1">
                    {campaign.name}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveFromCampaign(campaign.id)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">Not assigned to any campaigns</p>
            )}
          </div>

          {/* Add to existing campaign */}
          <div>
            <Label className="text-sm font-medium">Add to Campaign</Label>
            <div className="flex gap-2 mt-2">
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {availableCampaignsForAssignment.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center gap-2">
                        {campaign.name}
                        {campaign.status && (
                          <Badge variant="outline" className="text-xs">
                            {campaign.status}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {availableCampaignsForAssignment.length === 0 && (
                    <SelectItem value="none" disabled>
                      No available campaigns
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddToCampaign} 
                disabled={!selectedCampaignId || isLoading}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Create new campaign */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Create New Campaign</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreatingCampaign(!isCreatingCampaign)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Campaign
              </Button>
            </div>
            
            {isCreatingCampaign && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="campaignName" className="text-sm">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="campaignDescription" className="text-sm">Description (optional)</Label>
                  <Textarea
                    id="campaignDescription"
                    value={newCampaignDescription}
                    onChange={(e) => setNewCampaignDescription(e.target.value)}
                    placeholder="Enter campaign description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateCampaign}
                    disabled={!newCampaignName.trim() || isLoading}
                    size="sm"
                    className="flex-1"
                  >
                    Create Campaign
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCreatingCampaign(false);
                      setNewCampaignName('');
                      setNewCampaignDescription('');
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> These are content creator campaigns. They can be linked to advertising campaigns separately for integrated campaign management.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
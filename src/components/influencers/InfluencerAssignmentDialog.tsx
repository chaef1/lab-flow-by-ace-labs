import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Target } from "lucide-react";

interface InfluencerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerData: any;
  onAssignmentComplete: () => void;
}

export default function InfluencerAssignmentDialog({
  open,
  onOpenChange,
  influencerData,
  onAssignmentComplete
}: InfluencerAssignmentDialogProps) {
  const [activeTab, setActiveTab] = useState<'campaign' | 'pool'>('campaign');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, description, status')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch influencer pools
  const { data: pools } = useQuery({
    queryKey: ['influencer-pools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_pools')
        .select('id, name, description')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCampaign(true);
    try {
      // For now, create campaigns without client_id (can be added later)
      // We'll use a default client or make it optional in the schema
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaignName,
          description: newCampaignDescription,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          client_id: '00000000-0000-0000-0000-000000000000' // Default placeholder
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedCampaign(campaign.id);
      setNewCampaignName('');
      setNewCampaignDescription('');
      
      toast({
        title: "Campaign created",
        description: "Campaign created successfully",
      });
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) {
      toast({
        title: "Pool name required",
        description: "Please enter a pool name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPool(true);
    try {
      const { data: pool, error } = await supabase
        .from('influencer_pools')
        .insert({
          name: newPoolName,
          description: newPoolDescription,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedPool(pool.id);
      setNewPoolName('');
      setNewPoolDescription('');
      
      toast({
        title: "Pool created",
        description: "Influencer pool created successfully",
      });
    } catch (error: any) {
      console.error('Error creating pool:', error);
      toast({
        title: "Failed to create pool",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPool(false);
    }
  };

  const handleAssignToCampaign = async () => {
    if (!selectedCampaign || !influencerData?.id) return;

    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('campaign_influencers')
        .insert({
          campaign_id: selectedCampaign,
          influencer_id: influencerData.id,
          added_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Influencer assigned",
        description: "Influencer has been assigned to the campaign",
      });

      onAssignmentComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning to campaign:', error);
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignToPool = async () => {
    if (!selectedPool || !influencerData?.id) return;

    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('influencer_pool_members')
        .insert({
          pool_id: selectedPool,
          influencer_id: influencerData.id,
          added_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Influencer added to pool",
        description: "Influencer has been added to the pool",
      });

      onAssignmentComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding to pool:', error);
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Influencer</DialogTitle>
          <DialogDescription>
            Add {influencerData?.username || influencerData?.full_name} to a campaign or pool
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'campaign' | 'pool')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaign" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campaign
            </TabsTrigger>
            <TabsTrigger value="pool" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pool
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-select">Select Campaign</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns?.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCampaign && (
                <Button 
                  onClick={handleAssignToCampaign} 
                  disabled={isAssigning}
                  className="w-full"
                >
                  {isAssigning ? 'Assigning...' : 'Assign to Campaign'}
                </Button>
              )}
            </div>

            <div className="border-t pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create New Campaign</CardTitle>
                  <CardDescription>
                    Create a new campaign and assign the influencer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="new-campaign-name">Campaign Name</Label>
                    <Input
                      id="new-campaign-name"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-campaign-description">Description</Label>
                    <Textarea
                      id="new-campaign-description"
                      value={newCampaignDescription}
                      onChange={(e) => setNewCampaignDescription(e.target.value)}
                      placeholder="Campaign description (optional)"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateCampaign} 
                    disabled={isCreatingCampaign}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pool" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="pool-select">Select Pool</Label>
                <Select value={selectedPool} onValueChange={setSelectedPool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {pools?.map((pool) => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPool && (
                <Button 
                  onClick={handleAssignToPool} 
                  disabled={isAssigning}
                  className="w-full"
                >
                  {isAssigning ? 'Adding...' : 'Add to Pool'}
                </Button>
              )}
            </div>

            <div className="border-t pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create New Pool</CardTitle>
                  <CardDescription>
                    Create a new influencer pool and add the influencer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="new-pool-name">Pool Name</Label>
                    <Input
                      id="new-pool-name"
                      value={newPoolName}
                      onChange={(e) => setNewPoolName(e.target.value)}
                      placeholder="Enter pool name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-pool-description">Description</Label>
                    <Textarea
                      id="new-pool-description"
                      value={newPoolDescription}
                      onChange={(e) => setNewPoolDescription(e.target.value)}
                      placeholder="Pool description (optional)"
                    />
                  </div>
                  <Button 
                    onClick={handleCreatePool} 
                    disabled={isCreatingPool}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreatingPool ? 'Creating...' : 'Create Pool'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
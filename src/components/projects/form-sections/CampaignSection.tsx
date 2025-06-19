
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  status: string;
}

interface CampaignSectionProps {
  selectedClient: string;
  selectedCampaign: string;
  onCampaignChange: (campaignId: string) => void;
}

const CampaignSection = ({ selectedClient, selectedCampaign, onCampaignChange }: CampaignSectionProps) => {
  const { userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    total_budget: "",
    status: "planning",
  });

  useEffect(() => {
    if (selectedClient) {
      fetchCampaigns();
    }
  }, [selectedClient]);

  const fetchCampaigns = async () => {
    if (!selectedClient) return;

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("client_id", selectedClient)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } else {
      setCampaigns(data || []);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedClient || !userProfile) {
      toast.error("Please select a client first");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          ...newCampaign,
          client_id: selectedClient,
          created_by: userProfile.id,
          total_budget: newCampaign.total_budget ? parseFloat(newCampaign.total_budget) : null,
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns([data, ...campaigns]);
      onCampaignChange(data.id);
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        total_budget: "",
        status: "planning",
      });
      toast.success("Campaign created successfully!");
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(`Error creating campaign: ${error.message}`);
    }
  };

  if (!selectedClient) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Please select a client first to manage campaigns
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Select Campaign (Optional)</Label>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create a new campaign for the selected client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign_name">Campaign Name *</Label>
                <Input
                  id="campaign_name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Enter campaign description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="total_budget">Total Budget</Label>
                <Input
                  id="total_budget"
                  type="number"
                  step="0.01"
                  value={newCampaign.total_budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, total_budget: e.target.value })}
                  placeholder="Enter total budget"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCampaign.status}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} disabled={!newCampaign.name}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Select value={selectedCampaign} onValueChange={onCampaignChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a campaign (optional)" />
        </SelectTrigger>
        <SelectContent>
          {campaigns.map((campaign) => (
            <SelectItem key={campaign.id} value={campaign.id}>
              {campaign.name} - {campaign.status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCampaign && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          {campaigns.find(c => c.id === selectedCampaign) && (
            <div className="space-y-2">
              <p><strong>Campaign:</strong> {campaigns.find(c => c.id === selectedCampaign)?.name}</p>
              <p><strong>Status:</strong> {campaigns.find(c => c.id === selectedCampaign)?.status}</p>
              <p><strong>Budget:</strong> ${campaigns.find(c => c.id === selectedCampaign)?.total_budget}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignSection;

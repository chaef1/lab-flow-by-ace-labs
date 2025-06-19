
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Users, Calendar, DollarSign } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useClients } from "@/hooks/useClients";

const ProjectOverview = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  const { data: projects = [] } = useProjects();
  const { data: campaigns = [] } = useCampaigns();
  const { data: clients = [] } = useClients();

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedCampaign(null);
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
  };

  const clientCampaigns = campaigns.filter(c => c.client_id === selectedClient);
  const campaignProjects = projects.filter(p => p.campaign_id === selectedCampaign);

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Client Overview</h2>
          <p className="text-muted-foreground">Select a client to view their campaigns and projects</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const clientCampaigns = campaigns.filter(c => c.client_id === client.id);
            const clientProjects = projects.filter(p => p.client_id === client.id);
            
            return (
              <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleClientSelect(client.id)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {client.name}
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>{client.company_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{clientCampaigns.length} campaigns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{clientProjects.length} projects</span>
                    </div>
                    {client.brief && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{client.brief}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (!selectedCampaign) {
    const client = clients.find(c => c.id === selectedClient);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSelectedClient(null)}>
            ← Back to Clients
          </Button>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold">{client?.name} Campaigns</h2>
          <p className="text-muted-foreground">Select a campaign to view its projects</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientCampaigns.map((campaign) => {
            const campaignProjects = projects.filter(p => p.campaign_id === campaign.id);
            
            return (
              <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCampaignSelect(campaign.id)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {campaign.name}
                    <ChevronRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>
                    <Badge variant={campaign.status === 'in_progress' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{campaignProjects.length} projects</span>
                    </div>
                    {campaign.total_budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">${campaign.total_budget.toLocaleString()}</span>
                      </div>
                    )}
                    {campaign.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const campaign = campaigns.find(c => c.id === selectedCampaign);
  const client = clients.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setSelectedCampaign(null)}>
          ← Back to {client?.name} Campaigns
        </Button>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold">{campaign?.name} Projects</h2>
        <p className="text-muted-foreground">Projects under this campaign</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaignProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>
                <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(project.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectOverview;

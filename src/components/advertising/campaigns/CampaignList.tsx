
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash, MoreHorizontal, Download, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  budget: number;
  startDate?: string;
  endDate?: string;
  creatives?: number;
  insights?: any;
  spend?: string;
  campaign_id?: string;
  created_time?: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  platform: 'tiktok' | 'meta';
  onUpdateStatus: (campaignId: string, newStatus: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  platform,
  onUpdateStatus,
  isConnected,
  isLoading,
  isRefreshing,
  error
}) => {
  const { toast } = useToast();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
        <h3 className="text-lg font-medium mb-2">Connect Your {platform === 'meta' ? 'Meta' : 'TikTok'} Account</h3>
        <p className="text-center text-muted-foreground mb-4">
          Please connect your {platform === 'meta' ? 'Meta' : 'TikTok'} account to view and manage your campaigns
        </p>
      </div>
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/15 p-4 rounded-lg text-destructive flex items-start">
        <div className="mr-2 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h4 className="font-medium">Error</h4>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }
  
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
        <h3 className="text-lg font-medium mb-2">No Campaigns Created Yet</h3>
        <p className="text-center text-muted-foreground mb-4">
          Create your first {platform === 'meta' ? 'Meta' : 'TikTok'} advertising campaign to start promoting your content
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id || campaign.campaign_id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{campaign.name}</CardTitle>
                <CardDescription>
                  Objective: {platform === 'meta' ? campaign.objective : campaign.objective_type || 'Not specified'}
                </CardDescription>
              </div>
              <Badge variant={
                (campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'default' : 
                (campaign.status === 'Scheduled' || campaign.status === 'PAUSED') ? 'secondary' :
                'outline'
              }>
                {campaign.status || 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Budget/Spend</p>
                <p className="text-xl font-bold">
                  ${campaign.budget?.toFixed(2) || '0.00'} / ${platform === 'meta' ? 
                    (parseFloat(campaign.spend || '0') || 0).toFixed(2) : 
                    (parseFloat(campaign.budget || '0') || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="text-base">{campaign.id || campaign.campaign_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {campaign.startDate ? 'Duration' : 'Created'}
                </p>
                <p className="text-base">
                  {campaign.startDate && campaign.endDate ? 
                    `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` : 
                    (campaign.created_time ? new Date(campaign.created_time).toLocaleDateString() : 'N/A')}
                </p>
              </div>
            </div>
            
            {campaign.insights && (
              <div className="mt-4 pt-4 border-t">
                <p className="font-medium mb-2">Performance Metrics</p>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Impressions</p>
                    <p className="font-medium">{campaign.insights.impressions || '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clicks</p>
                    <p className="font-medium">{campaign.insights.clicks || '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CTR</p>
                    <p className="font-medium">{campaign.insights.ctr || '0%'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost/Result</p>
                    <p className="font-medium">${campaign.insights.cost_per_result || '0.00'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">View Details</Button>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Campaign Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => toast({title: "Editing", description: "Opening campaign editor"})}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({title: "Duplicating", description: "Duplicating campaign"})}>
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="8" y="8" width="12" height="12" rx="2" />
                      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                    </svg> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(campaign.status === 'ACTIVE' || campaign.status === 'Active') ? (
                    <DropdownMenuItem onClick={() => onUpdateStatus(campaign.id, 'PAUSED')}>
                      <Pause className="mr-2 h-4 w-4" /> Pause Campaign
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onUpdateStatus(campaign.id, 'ACTIVE')}>
                      <Play className="mr-2 h-4 w-4" /> Activate Campaign
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast({title: "Exporting", description: "Exporting campaign data"})}>
                    <Download className="mr-2 h-4 w-4" /> Export Data
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => toast({title: "Deleting", description: "Deleting campaign"})}>
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant={(campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'destructive' : 'default'} 
                size="sm"
                onClick={() => onUpdateStatus(
                  campaign.id, 
                  (campaign.status === 'ACTIVE' || campaign.status === 'Active') ? 'PAUSED' : 'ACTIVE'
                )}
              >
                {(campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'Pause' : 
                 (campaign.status === 'Scheduled' || campaign.status === 'PAUSED') ? 'Activate' : 
                 'Activate'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CampaignList;

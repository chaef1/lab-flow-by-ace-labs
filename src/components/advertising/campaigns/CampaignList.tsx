
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, BarChart, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface Campaign {
  id: string;
  name: string;
  status: string;
  budget?: number;
  objective?: string;
  spend?: string | number;
  startDate?: string;
  endDate?: string;
  creatives?: number;
  insights?: any;
}

interface CampaignListProps {
  campaigns: Campaign[];
  platform: 'meta';
  isConnected?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
}

const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  platform,
  isConnected = false,
  isLoading = false,
  isRefreshing = false,
  error = null,
  onUpdateStatus
}) => {
  const { toast } = useToast();

  // Helper function for status badge display
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'active' || statusLower === 'delivering') {
      return <Badge className="bg-green-500">Active</Badge>;
    } else if (statusLower === 'paused') {
      return <Badge className="bg-yellow-500">Paused</Badge>;
    } else if (statusLower === 'draft') {
      return <Badge className="bg-gray-500">Draft</Badge>;
    } else if (statusLower === 'completed') {
      return <Badge className="bg-blue-500">Completed</Badge>;
    } else if (statusLower === 'archived') {
      return <Badge className="bg-gray-700 text-white">Archived</Badge>;
    } else if (statusLower === 'error' || statusLower === 'rejected') {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    return <Badge>{status}</Badge>;
  };

  // Handle status change button click with error handling
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!onUpdateStatus) return;
    
    try {
      await onUpdateStatus(id, newStatus);
      
      toast({
        title: "Campaign Updated",
        description: `Campaign status changed to ${newStatus === 'ACTIVE' ? 'Active' : 'Paused'}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Status Update Failed",
        description: error.message || "There was an error updating the campaign status",
      });
    }
  };

  // Loading skeleton
  if (isLoading && !isRefreshing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if ((!campaigns || campaigns.length === 0) && !isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">
            {isConnected ? 
              `No Meta campaigns found.` : 
              `Connect your Meta account to view campaigns.`
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {isConnected ? 
              "Create your first campaign to get started with advertising." : 
              "Once connected, you'll be able to create and manage your campaigns."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-500 font-medium mb-1">Error loading campaigns</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the right objective name based on platform
  const getObjective = (campaign: Campaign) => {
    // Map Meta objectives to readable names
    const objectiveMap: {[key: string]: string} = {
      'AWARENESS': 'Brand Awareness',
      'REACH': 'Reach',
      'TRAFFIC': 'Traffic',
      'APP_INSTALLS': 'App Installs',
      'ENGAGEMENT': 'Engagement',
      'VIDEO_VIEWS': 'Video Views',
      'LEAD_GENERATION': 'Lead Generation',
      'CONVERSIONS': 'Conversions',
      'CATALOG_SALES': 'Catalog Sales'
    };
    
    return objectiveMap[campaign.objective || ''] || campaign.objective || 'N/A';
  };

  // Convert spend to number for formatting
  const formatSpend = (spend: string | number | undefined): string => {
    if (!spend) return formatCurrency(0);
    
    // If it's already a number, format it
    if (typeof spend === 'number') {
      return formatCurrency(spend);
    }
    
    // Try to parse the string as a number
    const numericSpend = parseFloat(spend);
    if (!isNaN(numericSpend)) {
      return formatCurrency(numericSpend);
    }
    
    // Return the original string if parsing fails
    return spend;
  };

  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              // Convert status to lowercase for consistent comparison
              const isActive = campaign.status.toLowerCase() === 'active';
              
              return (
                <TableRow key={campaign.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getObjective(campaign)}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    {campaign.budget ? formatCurrency(campaign.budget) : 'N/A'}
                  </TableCell>
                  <TableCell>{formatSpend(campaign.spend)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onUpdateStatus && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(
                            campaign.id,
                            isActive ? 'PAUSED' : 'ACTIVE'
                          )}
                          title={isActive ? "Pause campaign" : "Activate campaign"}
                        >
                          {isActive ? 
                            <Pause className="h-4 w-4" /> : 
                            <Play className="h-4 w-4" />
                          }
                        </Button>
                      )}
                      <Button variant="outline" size="sm" title="View insights">
                        <BarChart className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {isRefreshing && (
          <div className="flex justify-center mt-4">
            <p className="text-sm text-muted-foreground flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
              Refreshing campaigns...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignList;

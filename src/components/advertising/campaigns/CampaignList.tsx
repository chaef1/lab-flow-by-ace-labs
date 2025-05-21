
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, BarChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  platform: 'meta';  // Removed 'tiktok' option as requested
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
    }
    
    return <Badge>{status}</Badge>;
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
              `No ${platform === 'meta' ? 'Meta' : ''} campaigns found.` : 
              `Connect your ${platform === 'meta' ? 'Meta' : ''} account to view campaigns.`
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
        <CardContent className="pt-6 text-center">
          <p className="text-red-500 mb-2">Error loading campaigns</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
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
                        onClick={() => onUpdateStatus(
                          campaign.id,
                          campaign.status.toLowerCase() === 'active' ? 'PAUSED' : 'ACTIVE'
                        )}
                      >
                        {campaign.status.toLowerCase() === 'active' ? 
                          <Pause className="h-4 w-4" /> : 
                          <Play className="h-4 w-4" />
                        }
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <BarChart className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CampaignList;


import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget: number;
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  startDate: string;
  endDate: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
  platform: string;
}

const CampaignTable = ({ campaigns, platform }: CampaignTableProps) => {
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    if (sortColumn === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortColumn === 'budget') {
      return sortDirection === 'asc' 
        ? a.budget - b.budget
        : b.budget - a.budget;
    } else if (sortColumn === 'startDate') {
      return sortDirection === 'asc' 
        ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        : new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>Active and recent {platform === 'meta' ? 'Meta' : 'TikTok'} campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Campaign Name
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('budget')}
                >
                  Budget
                </TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('startDate')}
                >
                  Dates
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.objective}</TableCell>
                  <TableCell>${campaign.budget}/day</TableCell>
                  <TableCell>{campaign.spend}</TableCell>
                  <TableCell>{campaign.impressions}</TableCell>
                  <TableCell>{campaign.clicks}</TableCell>
                  <TableCell>{campaign.ctr}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>{formatDate(campaign.startDate)}</div>
                      <div>{campaign.endDate ? `to ${formatDate(campaign.endDate)}` : 'Ongoing'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    No campaigns to display
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTable;


import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Filter } from "lucide-react";
import { useCampaignProjects } from "@/hooks/useCampaignProjects";
import { formatCurrency, calculateCampaignProgress, campaignStatusLabels, campaignElementLabels } from "@/lib/campaign-utils";
import CreateCampaignDialog from "./CreateCampaignDialog";

const CampaignProjectList = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [elementFilter, setElementFilter] = useState<string>('all');
  
  const { campaigns, createCampaign } = useCampaignProjects();

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    const matchesElement = elementFilter === 'all' || 
      campaign.elements.includes(elementFilter as any);

    return matchesSearch && matchesStatus && matchesElement;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'briefed': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'reverted': return 'bg-red-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campaign Projects List</h2>
          <p className="text-muted-foreground">Comprehensive view of all campaign projects</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(campaignStatusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={elementFilter} onValueChange={setElementFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Element" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Elements</SelectItem>
            {Object.entries(campaignElementLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Elements</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map(campaign => {
              const progress = calculateCampaignProgress(campaign);
              const isOverdue = new Date(campaign.endDate) < new Date();
              
              return (
                <TableRow key={campaign.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.campaignName}</p>
                    </div>
                  </TableCell>
                  <TableCell>{campaign.clientName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {campaign.elements.map(element => (
                        <Badge key={element} variant="outline" className="text-xs">
                          {campaignElementLabels[element]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{campaign.campaignOwner}</TableCell>
                  <TableCell>{formatCurrency(campaign.budget)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={progress} className="w-16" />
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaignStatusLabels[campaign.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CreateCampaignDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={createCampaign}
      />
    </div>
  );
};

export default CampaignProjectList;

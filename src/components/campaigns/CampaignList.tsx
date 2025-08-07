import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Calendar, DollarSign, Users, MoreHorizontal } from 'lucide-react';

const sampleCampaigns = [
  {
    id: '1',
    name: 'Summer Fashion Launch',
    client: 'Fashion Nova',
    status: 'active',
    stage: 'Discovery',
    budget: 50000,
    startDate: '2024-02-15',
    endDate: '2024-03-15',
    influencersCount: 0,
    targetInfluencers: 15,
    progress: 20
  },
  {
    id: '2',
    name: 'Fitness Equipment Promo',
    client: 'GymGear Pro',
    status: 'active',
    stage: 'Outreach',
    budget: 25000,
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    influencersCount: 5,
    targetInfluencers: 10,
    progress: 45
  },
  {
    id: '3',
    name: 'Beauty Product Launch',
    client: 'Glow Cosmetics',
    status: 'active',
    stage: 'Briefing',
    budget: 75000,
    startDate: '2024-01-15',
    endDate: '2024-03-30',
    influencersCount: 12,
    targetInfluencers: 20,
    progress: 60
  }
];

export function CampaignList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const filteredCampaigns = sampleCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesStage = stageFilter === 'all' || campaign.stage === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Discovery': return 'bg-blue-100 text-blue-800';
      case 'Outreach': return 'bg-yellow-100 text-yellow-800';
      case 'Briefing': return 'bg-purple-100 text-purple-800';
      case 'Approval': return 'bg-orange-100 text-orange-800';
      case 'Live': return 'bg-green-100 text-green-800';
      case 'Reporting': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Discovery">Discovery</SelectItem>
              <SelectItem value="Outreach">Outreach</SelectItem>
              <SelectItem value="Briefing">Briefing</SelectItem>
              <SelectItem value="Approval">Approval</SelectItem>
              <SelectItem value="Live">Live</SelectItem>
              <SelectItem value="Reporting">Reporting</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Creators</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {campaign.id}</div>
                  </div>
                </TableCell>
                <TableCell>{campaign.client}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStageColor(campaign.stage)}>
                    {campaign.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    ${campaign.budget.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-600" />
                    {campaign.influencersCount}/{campaign.targetInfluencers}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{campaign.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredCampaigns.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No campaigns found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
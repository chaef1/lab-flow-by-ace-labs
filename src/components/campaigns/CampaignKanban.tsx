import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  MoreHorizontal,
  Plus,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';

const stages = [
  { id: 'discovery', name: 'Discovery', color: 'bg-blue-100 text-blue-800' },
  { id: 'outreach', name: 'Outreach', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'briefing', name: 'Briefing', color: 'bg-purple-100 text-purple-800' },
  { id: 'approval', name: 'Approval', color: 'bg-orange-100 text-orange-800' },
  { id: 'live', name: 'Live', color: 'bg-green-100 text-green-800' },
  { id: 'report', name: 'Reporting', color: 'bg-gray-100 text-gray-800' }
];

const sampleCampaigns = [
  {
    id: '1',
    name: 'Summer Fashion Launch',
    client: 'Fashion Nova',
    stage: 'discovery',
    budget: 50000,
    startDate: '2024-02-15',
    endDate: '2024-03-15',
    influencersCount: 0,
    targetInfluencers: 15,
    progress: 20,
    status: 'active',
    teamMembers: [
      { id: '1', name: 'Sarah J', avatar: null },
      { id: '2', name: 'Mike R', avatar: null }
    ]
  },
  {
    id: '2',
    name: 'Fitness Equipment Promo',
    client: 'GymGear Pro',
    stage: 'outreach',
    budget: 25000,
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    influencersCount: 5,
    targetInfluencers: 10,
    progress: 45,
    status: 'active',
    teamMembers: [
      { id: '3', name: 'Alex C', avatar: null }
    ]
  },
  {
    id: '3',
    name: 'Beauty Product Launch',
    client: 'Glow Cosmetics',
    stage: 'briefing',
    budget: 75000,
    startDate: '2024-01-15',
    endDate: '2024-03-30',
    influencersCount: 12,
    targetInfluencers: 20,
    progress: 60,
    status: 'active',
    teamMembers: [
      { id: '4', name: 'Emma L', avatar: null },
      { id: '5', name: 'David M', avatar: null },
      { id: '6', name: 'Lisa K', avatar: null }
    ]
  },
  {
    id: '4',
    name: 'Tech Gadget Review',
    client: 'TechFlow',
    stage: 'live',
    budget: 35000,
    startDate: '2024-01-01',
    endDate: '2024-02-15',
    influencersCount: 8,
    targetInfluencers: 8,
    progress: 85,
    status: 'active',
    teamMembers: [
      { id: '7', name: 'Ryan P', avatar: null }
    ]
  }
];

export function CampaignKanban() {
  const [campaigns] = useState(sampleCampaigns);

  const getCampaignsByStage = (stageId: string) => {
    return campaigns.filter(campaign => campaign.stage === stageId);
  };

  const getStageCount = (stageId: string) => {
    return getCampaignsByStage(stageId).length;
  };

  return (
    <div className="h-[calc(100vh-200px)] overflow-hidden">
      <div className="flex space-x-6 h-full overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            {/* Stage Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={stage.color}>
                    {stage.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getStageCount(stage.id)}
                  </span>
                </div>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Campaign Cards */}
            <div className="space-y-4 max-h-full overflow-y-auto">
              {getCampaignsByStage(stage.id).map((campaign) => (
                <Card key={campaign.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{campaign.name}</h4>
                        <p className="text-xs text-muted-foreground">{campaign.client}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{campaign.progress}%</span>
                      </div>
                      <Progress value={campaign.progress} className="h-1" />
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="text-muted-foreground">Creators:</span>
                        <span className="font-medium">{campaign.influencersCount}/{campaign.targetInfluencers}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 col-span-2">
                        <Calendar className="h-3 w-3 text-purple-600" />
                        <span className="text-muted-foreground">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {campaign.teamMembers.slice(0, 3).map((member, index) => (
                          <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-secondary/20">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {campaign.teamMembers.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{campaign.teamMembers.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Stage-specific actions */}
                      <div className="flex space-x-1">
                        {stage.id === 'discovery' && (
                          <Button size="sm" variant="outline" className="text-xs h-6">
                            <Target className="h-3 w-3 mr-1" />
                            Find Creators
                          </Button>
                        )}
                        {stage.id === 'outreach' && (
                          <Button size="sm" variant="outline" className="text-xs h-6">
                            <Clock className="h-3 w-3 mr-1" />
                            Follow Up
                          </Button>
                        )}
                        {stage.id === 'live' && (
                          <Button size="sm" variant="outline" className="text-xs h-6">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Add Campaign Card */}
              <Card className="p-4 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm">Add Campaign</span>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
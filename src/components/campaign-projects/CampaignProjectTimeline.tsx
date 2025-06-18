
import { useCampaignProjects } from "@/hooks/useCampaignProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, User } from "lucide-react";
import { formatCurrency, calculateCampaignProgress, campaignStatusLabels, campaignElementLabels } from "@/lib/campaign-utils";

const CampaignProjectTimeline = () => {
  const { campaigns } = useCampaignProjects();

  // Sort campaigns by start date
  const sortedCampaigns = [...campaigns].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'briefed': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'reverted': return 'bg-red-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Campaign Timeline View</h2>
        <p className="text-muted-foreground">Gantt-style view of campaign projects grouped by timeline</p>
      </div>

      <div className="space-y-4">
        {sortedCampaigns.map(campaign => {
          const progress = calculateCampaignProgress(campaign);
          const duration = calculateDuration(campaign.startDate, campaign.endDate);
          const isActive = new Date() >= new Date(campaign.startDate) && new Date() <= new Date(campaign.endDate);
          const isOverdue = new Date(campaign.endDate) < new Date() && campaign.status !== 'complete';

          return (
            <Card key={campaign.id} className={`${isActive ? 'border-blue-500 bg-blue-50' : ''} ${isOverdue ? 'border-red-500 bg-red-50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{campaign.campaignName}</CardTitle>
                    <p className="text-muted-foreground">{campaign.clientName}</p>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaignStatusLabels[campaign.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Campaign Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">{duration} days</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Dates</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Owner</p>
                        <p className="text-sm text-muted-foreground">{campaign.campaignOwner}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Budget</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(campaign.budget)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  {/* Elements */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Campaign Elements</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.elements.map(element => (
                        <Badge key={element} variant="outline">
                          {campaignElementLabels[element]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Timeline</p>
                    <div className="relative">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isActive ? 'bg-blue-500' : isOverdue ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignProjectTimeline;

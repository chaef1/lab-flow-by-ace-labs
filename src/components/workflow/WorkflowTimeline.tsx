
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClientWorkflow } from "@/lib/workflow-utils";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle,
  AlertCircle,
  DollarSign,
  Users,
  Target
} from "lucide-react";

interface WorkflowTimelineProps {
  workflows: ClientWorkflow[];
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ workflows }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'on-hold': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'discovery': return 'bg-blue-500';
      case 'proposal': return 'bg-purple-500';
      case 'approved': return 'bg-green-500';
      case 'in-progress': return 'bg-amber-500';
      case 'review': return 'bg-orange-500';
      case 'completed': return 'bg-gray-500';
      case 'on-hold': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const calculateWorkflowProgress = (workflow: ClientWorkflow) => {
    const statusOrder = ['discovery', 'proposal', 'approved', 'in-progress', 'review', 'completed'];
    const currentIndex = statusOrder.indexOf(workflow.status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const getTimelineEvents = (workflow: ClientWorkflow) => {
    const events = [];
    
    // Add workflow milestones
    if (workflow.nextMilestone) {
      events.push({
        type: 'milestone',
        title: workflow.nextMilestone.title,
        description: workflow.nextMilestone.description,
        date: workflow.nextMilestone.dueDate,
        icon: Target
      });
    }

    // Add upcoming meetings
    const upcomingMeetings = workflow.meetings
      .filter(m => m.status === 'scheduled' && new Date(m.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    upcomingMeetings.forEach(meeting => {
      events.push({
        type: 'meeting',
        title: meeting.title,
        description: `${meeting.type} - ${meeting.duration}min`,
        date: meeting.date,
        icon: Calendar
      });
    });

    // Add active campaigns ending soon
    const endingSoon = workflow.campaigns
      .filter(c => c.status === 'active' && new Date(c.endDate) > new Date())
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 2);

    endingSoon.forEach(campaign => {
      events.push({
        type: 'campaign',
        title: `${campaign.name} ending`,
        description: `${campaign.type} campaign`,
        date: campaign.endDate,
        icon: Target
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="space-y-6">
      {workflows.map(workflow => {
        const progress = calculateWorkflowProgress(workflow);
        const timelineEvents = getTimelineEvents(workflow);
        const totalSpent = workflow.budgetAllocations.reduce((sum, a) => sum + a.spent, 0);
        const budgetUtilization = workflow.totalBudget > 0 ? (totalSpent / workflow.totalBudget) * 100 : 0;

        return (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(workflow.status)}
                    <span>{workflow.type.replace('-', ' ').toUpperCase()} Workflow</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status.replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>{budgetUtilization.toFixed(1)}% budget used</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span>{workflow.campaigns.length} campaigns</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{workflow.meetings.length} meetings</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {progress.toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Discovery</span>
                    <span>Proposal</span>
                    <span>Approved</span>
                    <span>In Progress</span>
                    <span>Review</span>
                    <span>Complete</span>
                  </div>
                </div>

                {/* Timeline Events */}
                {timelineEvents.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Upcoming Events</h4>
                    <div className="space-y-2">
                      {timelineEvents.map((event, index) => {
                        const EventIcon = event.icon;
                        const isOverdue = new Date(event.date) < new Date();
                        
                        return (
                          <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <div className={`p-1 rounded ${
                              event.type === 'milestone' ? 'bg-purple-100' :
                              event.type === 'meeting' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              <EventIcon className={`h-3 w-3 ${
                                event.type === 'milestone' ? 'text-purple-600' :
                                event.type === 'meeting' ? 'text-blue-600' : 'text-green-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{event.title}</p>
                                  <p className="text-xs text-muted-foreground">{event.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    {new Date(event.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(event.date).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Recent Activity</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Workflow created</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Last updated</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {workflow.campaigns.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Latest campaign</span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.campaigns[workflow.campaigns.length - 1].name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default WorkflowTimeline;

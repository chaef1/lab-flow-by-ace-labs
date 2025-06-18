
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Plus,
  Clock,
  Target
} from "lucide-react";
import { ClientWorkflow, formatCurrency, calculateBudgetUtilization } from "@/lib/workflow-utils";
import BudgetOverview from './BudgetOverview';
import CampaignTracker from './CampaignTracker';
import MeetingScheduler from './MeetingScheduler';
import WorkflowTimeline from './WorkflowTimeline';

interface WorkflowManagerProps {
  projectId: string;
  workflows: ClientWorkflow[];
  onUpdateWorkflow: (workflow: ClientWorkflow) => void;
  onCreateWorkflow: (type: string) => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  projectId,
  workflows,
  onUpdateWorkflow,
  onCreateWorkflow
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const totalBudget = workflows.reduce((sum, w) => sum + w.totalBudget, 0);
  const totalSpent = workflows.reduce((sum, w) => 
    sum + w.budgetAllocations.reduce((allocSum, alloc) => allocSum + alloc.spent, 0), 0
  );
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const activeCampaigns = workflows.flatMap(w => w.campaigns.filter(c => c.status === 'active'));
  const upcomingMeetings = workflows.flatMap(w => 
    w.meetings.filter(m => m.status === 'scheduled' && new Date(m.date) > new Date())
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Budget Used</p>
                <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
                <Progress value={budgetUtilization} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Active Campaigns</p>
                <p className="text-2xl font-bold">{activeCampaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Upcoming Meetings</p>
                <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <Button onClick={() => onCreateWorkflow('paid-media')}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{workflow.type.replace('-', ' ').toUpperCase()}</p>
                        <Badge variant="secondary">{workflow.status}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-medium">{formatCurrency(workflow.totalBudget)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Next Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows
                    .filter(w => w.nextMilestone)
                    .sort((a, b) => new Date(a.nextMilestone!.dueDate).getTime() - new Date(b.nextMilestone!.dueDate).getTime())
                    .map(workflow => (
                      <div key={workflow.id} className="flex items-start space-x-3 p-3 border rounded">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{workflow.nextMilestone?.title}</p>
                          <p className="text-sm text-muted-foreground">{workflow.nextMilestone?.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(workflow.nextMilestone!.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <BudgetOverview workflows={workflows} onUpdate={onUpdateWorkflow} />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignTracker workflows={workflows} onUpdate={onUpdateWorkflow} />
        </TabsContent>

        <TabsContent value="meetings">
          <MeetingScheduler workflows={workflows} onUpdate={onUpdateWorkflow} />
        </TabsContent>

        <TabsContent value="timeline">
          <WorkflowTimeline workflows={workflows} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowManager;

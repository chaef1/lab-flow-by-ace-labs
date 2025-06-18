
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { CampaignProject, TaskStatus, taskStatusLabels, campaignElementLabels } from "@/lib/campaign-utils";
import CreateCampaignDialog from "./CreateCampaignDialog";
import CampaignTaskCard from "./CampaignTaskCard";
import { useCampaignProjects } from "@/hooks/useCampaignProjects";

const CampaignProjectBoard = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { campaigns, updateCampaign, createCampaign } = useCampaignProjects();

  const taskColumns: TaskStatus[] = ['todo', 'in-progress', 'revert', 'approved', 'completed'];

  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'bg-gray-100';
      case 'in-progress': return 'bg-blue-100';
      case 'revert': return 'bg-red-100';
      case 'approved': return 'bg-green-100';
      case 'completed': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  const getTasksForColumn = (status: TaskStatus) => {
    return campaigns.flatMap(campaign => 
      campaign.tasks
        .filter(task => task.status === status)
        .map(task => ({ ...task, campaign }))
    );
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    const campaign = campaigns.find(c => c.tasks.some(t => t.id === taskId));
    if (!campaign) return;

    const updatedTasks = campaign.tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            ...(newStatus === 'revert' ? { revertedAt: new Date().toISOString() } : {}),
            ...(newStatus === 'completed' || newStatus === 'approved' ? { completedAt: new Date().toISOString() } : {})
          }
        : task
    );

    updateCampaign({ ...campaign, tasks: updatedTasks });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campaign Project Board</h2>
          <p className="text-muted-foreground">Manage campaign deliverables by status</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign Project
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 min-h-[600px]">
        {taskColumns.map(status => {
          const tasksInColumn = getTasksForColumn(status);
          
          return (
            <Card key={status} className={`${getColumnColor(status)} border-2`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium">{taskStatusLabels[status]}</span>
                  <Badge variant="secondary" className="ml-2">
                    {tasksInColumn.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasksInColumn.map(({ campaign, ...task }) => (
                  <CampaignTaskCard
                    key={task.id}
                    task={task}
                    campaign={campaign}
                    onStatusChange={(newStatus) => handleTaskMove(task.id, newStatus)}
                  />
                ))}
                {tasksInColumn.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No tasks in {taskStatusLabels[status].toLowerCase()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateCampaignDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={createCampaign}
      />
    </div>
  );
};

export default CampaignProjectBoard;

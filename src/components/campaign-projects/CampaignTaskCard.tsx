
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Clock, User, AlertTriangle } from "lucide-react";
import { CampaignTask, CampaignProject, TaskStatus, taskStatusLabels, campaignElementLabels } from "@/lib/campaign-utils";

interface CampaignTaskCardProps {
  task: CampaignTask;
  campaign: CampaignProject;
  onStatusChange: (status: TaskStatus) => void;
}

const CampaignTaskCard: React.FC<CampaignTaskCardProps> = ({ 
  task, 
  campaign, 
  onStatusChange 
}) => {
  const getElementColor = (element: string) => {
    switch (element) {
      case 'video': return 'bg-blue-500';
      case 'radio': return 'bg-purple-500';
      case 'design': return 'bg-green-500';
      case 'influencers': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isStuckInRevert = task.status === 'revert' && task.revertedAt && 
    new Date(task.revertedAt) <= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{campaign.campaignName}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(taskStatusLabels).map(([status, label]) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onStatusChange(status as TaskStatus)}
                    disabled={status === task.status}
                  >
                    Move to {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Element Badge */}
          <div className="flex items-center space-x-2">
            <Badge className={`${getElementColor(task.element)} text-white text-xs`}>
              {campaignElementLabels[task.element]}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            {isStuckInRevert && (
              <Badge variant="destructive" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Stuck 3+ days
              </Badge>
            )}
          </div>

          {/* Assignees */}
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {task.assignedTo.join(', ')}
              </span>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Time Tracked */}
          {task.timeTracked && task.timeTracked > 0 && (
            <div className="text-xs text-muted-foreground">
              {Math.floor(task.timeTracked / 60)}h {task.timeTracked % 60}m tracked
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTaskCard;

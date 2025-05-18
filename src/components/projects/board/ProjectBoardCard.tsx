
import { useState } from "react";
import { BoardProject, isDatePast, isDateSoon } from "@/lib/project-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import ProjectBoardCardDetails from "./ProjectBoardCardDetails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectBoardCardProps {
  project: BoardProject;
  showMembers?: boolean;
  showDueDate?: boolean;
}

const ProjectBoardCard = ({
  project,
  showMembers = true,
  showDueDate = true,
}: ProjectBoardCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Format due date
  const formattedDate = new Date(project.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  // Date status classes
  const dateClass = isDatePast(project.dueDate) 
    ? 'text-red-600 font-medium' 
    : isDateSoon(project.dueDate) 
      ? 'text-amber-600 font-medium'
      : 'text-muted-foreground';
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("projectId", project.id);
  };

  return (
    <>
      <div 
        className="bg-background border rounded-md p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={project.clientAvatar} />
              <AvatarFallback>{project.client.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{project.client}</span>
          </div>
          
          {showDueDate && (
            <div className={`flex items-center text-xs gap-1 ${dateClass}`}>
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
        
        <h4 className="font-medium text-sm mb-2 line-clamp-2">{project.name}</h4>
        
        {project.primaryChannels && project.primaryChannels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {project.primaryChannels.slice(0, 2).map((channel, index) => (
              <Badge key={index} variant="outline" className="text-xs py-0 h-5">{channel}</Badge>
            ))}
            {project.primaryChannels.length > 2 && (
              <Badge variant="outline" className="text-xs py-0 h-5">+{project.primaryChannels.length - 2}</Badge>
            )}
          </div>
        )}
        
        <div className="space-y-1 mt-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
        
        {showMembers && project.team.length > 0 && (
          <div className="flex justify-end mt-3">
            <div className="flex -space-x-2">
              {project.team.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="border-2 border-background h-6 w-6">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {project.team.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{project.team.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project.name}</DialogTitle>
          </DialogHeader>
          <ProjectBoardCardDetails project={project} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectBoardCard;

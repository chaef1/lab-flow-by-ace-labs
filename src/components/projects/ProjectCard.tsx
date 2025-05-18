
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    client: string;
    clientAvatar?: string;
    dueDate: string;
    status: 'planning' | 'in-progress' | 'review' | 'completed';
    progress: number;
    team: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  };
  className?: string;
}

const statusColors = {
  'planning': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-amber-100 text-amber-800',
  'review': 'bg-purple-100 text-purple-800',
  'completed': 'bg-green-100 text-green-800',
};

const statusLabels = {
  'planning': 'Planning',
  'in-progress': 'In Progress',
  'review': 'In Review',
  'completed': 'Completed',
};

const ProjectCard = ({ project, className }: ProjectCardProps) => {
  const statusColor = statusColors[project.status] || 'bg-gray-100 text-gray-800';
  const statusLabel = statusLabels[project.status] || 'Unknown';
  
  // Format due date nicely
  const formattedDate = new Date(project.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="line-clamp-1">{project.description}</CardDescription>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.clientAvatar} />
              <AvatarFallback>{project.client.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{project.client}</span>
          </div>
          <span className="text-sm text-muted-foreground">Due: {formattedDate}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {project.team.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="border-2 border-background h-7 w-7">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {project.team.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{project.team.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;

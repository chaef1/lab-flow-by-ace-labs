
import { useMemo } from "react";
import { BoardProject } from "@/lib/project-utils";
import ProjectBoardCard from "./ProjectBoardCard";
import { Plus } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database['public']['Enums']['project_status'];

interface ProjectColumnProps {
  id: string;
  title: string;
  color: string;
  projects: BoardProject[];
  showMembers?: boolean;
  showDueDates?: boolean;
  onProjectMove: (projectId: string, newStatus: ProjectStatus) => void;
}

const ProjectColumn = ({
  id,
  title,
  color,
  projects,
  showMembers = true,
  showDueDates = true,
  onProjectMove,
}: ProjectColumnProps) => {
  const columnHeaderClass = `h-2 ${color} rounded-t-md`;
  
  // Calculate column progress
  const totalProjects = projects.length;
  const progress = useMemo(() => {
    if (totalProjects === 0) return 0;
    const totalProgress = projects.reduce((sum, project) => sum + project.progress, 0);
    return totalProgress / totalProjects;
  }, [projects]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("projectId");
    if (projectId) {
      onProjectMove(projectId, id as ProjectStatus);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-80 flex flex-col h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="bg-card rounded-md shadow-sm flex flex-col h-full">
        <div className={columnHeaderClass}></div>
        <div className="p-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <div className="text-xs text-muted-foreground">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</div>
          </div>
          
          <div className="flex items-center gap-2">
            {totalProjects > 0 && (
              <div className="text-xs font-medium">{Math.round(progress)}%</div>
            )}
            <button className="w-6 h-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {projects.map((project) => (
            <ProjectBoardCard
              key={project.id}
              project={project}
              showMembers={showMembers}
              showDueDate={showDueDates}
            />
          ))}
          
          {projects.length === 0 && (
            <div className="h-20 border border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground">
              Drag projects here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectColumn;

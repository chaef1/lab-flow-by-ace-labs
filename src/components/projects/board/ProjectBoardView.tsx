
import { useState, useRef } from "react";
import { projectStatuses } from "@/lib/project-utils";
import ProjectColumn from "./ProjectColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ListFilter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useProjects } from "@/hooks/useProjects";
import { useUpdateProjectStatus } from "@/hooks/useProjectStatus";
import CreateProjectDialog from "../CreateProjectDialog";
import { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'] & {
  clients?: {
    name: string;
  } | null;
};
type ProjectStatus = Database['public']['Enums']['project_status'];

// Convert database project to board project format
const convertToProjectBoardFormat = (project: Project) => {
  // Use client relationship name if available, fallback to client field, or use placeholder
  const clientName = project.clients?.name || project.client || 'Client';
  
  return {
    id: project.id,
    name: project.title,
    client: clientName,
    clientAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${clientName}`,
    description: project.description || '',
    dueDate: project.due_date || new Date().toISOString(),
    status: project.status,
    progress: Math.floor(Math.random() * 100), // TODO: Calculate real progress
    team: [], // TODO: Get real team members from project.members
    primaryChannels: ['Instagram', 'TikTok'], // TODO: Get from project data
  };
};

const ProjectBoardView = () => {
  const { data: projects = [], isLoading, refetch } = useProjects();
  const updateProjectStatus = useUpdateProjectStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [showDueDates, setShowDueDates] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert database projects to board format
  const boardProjects = projects.map(convertToProjectBoardFormat);

  const filteredProjects = boardProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group projects by status
  const projectsByStatus = projectStatuses.map(status => {
    return {
      ...status,
      projects: filteredProjects.filter(project => project.status === status.id)
    };
  });

  // Handle drag and drop of a project card
  const handleProjectMove = (projectId: string, newStatus: ProjectStatus) => {
    updateProjectStatus.mutate({ projectId, status: newStatus });
  };

  const handleProjectCreated = () => {
    refetch();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading projects...</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ListFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>View Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showMembers}
                onCheckedChange={setShowMembers}
              >
                Show Members
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showDueDates}
                onCheckedChange={setShowDueDates}
              >
                Show Due Dates
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-4 pt-1 h-full"
        ref={containerRef}
      >
        {projectsByStatus.map((column) => (
          <ProjectColumn
            key={column.id}
            id={column.id}
            title={column.label}
            color={column.color}
            projects={column.projects}
            showMembers={showMembers}
            showDueDates={showDueDates}
            onProjectMove={handleProjectMove}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectBoardView;

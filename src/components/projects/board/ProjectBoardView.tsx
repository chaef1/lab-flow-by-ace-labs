
import { useState, useRef } from "react";
import { BoardProject, projectStatuses } from "@/lib/project-utils";
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

// Import sample board data
import { boardProjects } from "@/data/board-projects";

const ProjectBoardView = () => {
  const [projects, setProjects] = useState<BoardProject[]>(boardProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [showDueDates, setShowDueDates] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredProjects = projects.filter((project) =>
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
  const handleProjectMove = (projectId: string, newStatus: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId ? { ...project, status: newStatus } : project
    ));
  };

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

        <Button className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
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

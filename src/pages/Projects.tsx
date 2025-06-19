
import { useState } from "react";
import Dashboard from "@/components/layout/Dashboard";
import ProjectList from "@/components/projects/ProjectList";
import ProjectBoardView from "@/components/projects/board/ProjectBoardView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListFilter, Grid } from "lucide-react";

const Projects = () => {
  const [view, setView] = useState<"board" | "list">("list");

  return (
    <Dashboard title="Projects" subtitle="Manage and track all your agency projects">
      <div className="flex justify-end mb-4">
        <Tabs 
          value={view} 
          onValueChange={(value) => setView(value as "board" | "list")}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="board" className="flex gap-1 items-center">
              <Grid className="h-4 w-4" />
              <span>Board</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex gap-1 items-center">
              <ListFilter className="h-4 w-4" />
              <span>List</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "board" ? <ProjectBoardView /> : <ProjectList />}
    </Dashboard>
  );
};

export default Projects;

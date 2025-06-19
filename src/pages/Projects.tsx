
import { useState } from "react";
import Dashboard from "@/components/layout/Dashboard";
import ProjectList from "@/components/projects/ProjectList";
import ProjectBoardView from "@/components/projects/board/ProjectBoardView";
import ProjectOverview from "@/components/projects/ProjectOverview";
import ClientPortal from "@/components/projects/ClientPortal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListFilter, Grid, Eye, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Projects = () => {
  const { userProfile } = useAuth();
  const [view, setView] = useState<"overview" | "board" | "list" | "client">("overview");

  // Show client portal for brand users
  if (userProfile?.role === 'brand') {
    return (
      <Dashboard title="Projects" subtitle="Track your project progress and provide feedback">
        <ClientPortal />
      </Dashboard>
    );
  }

  return (
    <Dashboard title="Projects" subtitle="Manage and track all your agency projects">
      <div className="flex justify-end mb-4">
        <Tabs 
          value={view} 
          onValueChange={(value) => setView(value as "overview" | "board" | "list" | "client")}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="overview" className="flex gap-1 items-center">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
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

      {view === "overview" && <ProjectOverview />}
      {view === "board" && <ProjectBoardView />}
      {view === "list" && <ProjectList />}
    </Dashboard>
  );
};

export default Projects;

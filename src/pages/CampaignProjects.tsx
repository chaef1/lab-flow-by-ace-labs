
import { useState } from 'react';
import Dashboard from "@/components/layout/Dashboard";
import CampaignProjectList from "@/components/campaign-projects/CampaignProjectList";
import CampaignProjectBoard from "@/components/campaign-projects/CampaignProjectBoard";
import CampaignProjectTimeline from "@/components/campaign-projects/CampaignProjectTimeline";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListFilter, Grid, Calendar } from "lucide-react";

const CampaignProjects = () => {
  const [view, setView] = useState<"board" | "list" | "timeline">("board");

  return (
    <Dashboard title="Campaign Projects" subtitle="Manage unified campaign projects with dynamic workflows">
      <div className="flex justify-end mb-4">
        <Tabs 
          value={view} 
          onValueChange={(value) => setView(value as "board" | "list" | "timeline")}
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
            <TabsTrigger value="timeline" className="flex gap-1 items-center">
              <Calendar className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "board" && <CampaignProjectBoard />}
      {view === "list" && <CampaignProjectList />}
      {view === "timeline" && <CampaignProjectTimeline />}
    </Dashboard>
  );
};

export default CampaignProjects;

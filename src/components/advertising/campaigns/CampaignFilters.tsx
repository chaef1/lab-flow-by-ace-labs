
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Download } from "lucide-react";

interface CampaignFiltersProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex gap-2 w-full md:w-auto">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>
    </div>
  );
};

export default CampaignFilters;

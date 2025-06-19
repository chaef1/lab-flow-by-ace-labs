
import { useState } from 'react';
import { Loader } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricCards from '../MetricCards';
import PerformanceChart from '../PerformanceChart';
import EngagementChart from '../EngagementChart';
import ContentTable from '../ContentTable';
import CreatorTable from '../CreatorTable';
import FacebookContentReports from '../facebook/FacebookContentReports';
import { useOrganicReportingData } from './useOrganicReportingData';

interface OrganicReportingProps {
  timeRange: string;
  platform: string;
}

const OrganicReporting = ({ timeRange, platform }: OrganicReportingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const data = useOrganicReportingData(timeRange, platform);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading organic reporting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MetricCards metrics={data.metrics} />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="creators">Creator Analytics</TabsTrigger>
          <TabsTrigger value="facebook">Facebook Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart data={data.contentPerformanceData} />
            <EngagementChart data={data.engagementData} />
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <ContentTable items={data.topPerformingContent} platform={platform} />
        </TabsContent>
        
        <TabsContent value="creators" className="space-y-6">
          <CreatorTable creators={data.creatorStats} />
        </TabsContent>
        
        <TabsContent value="facebook" className="space-y-6">
          <FacebookContentReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganicReporting;

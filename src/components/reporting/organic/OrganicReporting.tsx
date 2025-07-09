
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface OrganicReportingProps {
  timeRange: string;
  platform: string;
}

const OrganicReporting = ({ timeRange, platform }: OrganicReportingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const data = useOrganicReportingData(timeRange, platform);

  if (data.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>API Error - Organic Reporting Failed:</strong> {data.error}
        </AlertDescription>
      </Alert>
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


import { useState } from 'react';
import { Loader } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportingHeader from './ReportingHeader';
import MetricCards from './MetricCards';
import PerformanceChart from './PerformanceChart';
import EngagementChart from './EngagementChart';
import ContentTable from './ContentTable';
import CreatorTable from './CreatorTable';
import { useReportingData } from './useReportingData';

const ReportingContent = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [platform, setPlatform] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get data from hook
  const data = useReportingData();

  // Simulate data loading
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading reporting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <ReportingHeader 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        platform={platform}
        setPlatform={setPlatform}
      />

      <MetricCards metrics={data.metrics} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="creators">Creator Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <PerformanceChart data={data.contentPerformanceData} />
          <EngagementChart data={data.engagementData} />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <ContentTable items={data.topPerformingContent} platform={platform} />
        </TabsContent>
        
        <TabsContent value="creators" className="space-y-6">
          <CreatorTable creators={data.creatorStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingContent;

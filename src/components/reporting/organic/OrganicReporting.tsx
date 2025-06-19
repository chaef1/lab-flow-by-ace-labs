
import { useState } from 'react';
import { Loader } from 'lucide-react';
import MetricCards from '../MetricCards';
import PerformanceChart from '../PerformanceChart';
import EngagementChart from '../EngagementChart';
import ContentTable from '../ContentTable';
import CreatorTable from '../CreatorTable';
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={data.contentPerformanceData} />
        <EngagementChart data={data.engagementData} />
      </div>
      
      <ContentTable items={data.topPerformingContent} platform={platform} />
      <CreatorTable creators={data.creatorStats} />
    </div>
  );
};

export default OrganicReporting;

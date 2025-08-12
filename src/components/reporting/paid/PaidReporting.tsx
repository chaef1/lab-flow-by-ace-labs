
import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { usePaidReportingData } from './usePaidReportingData';
import PaidMetricCards from './PaidMetricCards';
import PaidPerformanceChart from './PaidPerformanceChart';
import AdSpendChart from './AdSpendChart';
import CampaignTable from './CampaignTable';

interface PaidReportingProps {
  timeRange: string;
  platform: string;
}

const PaidReporting = ({ timeRange, platform }: PaidReportingProps) => {
  // Meta ads only - simplified
  const [isLoading, setIsLoading] = useState(false);
  const { data, error, isConnected } = usePaidReportingData(timeRange);

  // Effect removed since we only support Meta ads now

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading paid reporting data...</p>
        </div>
      </div>
    );
  }
  
  if (!isConnected) {
    return (
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to connect your Meta account to view paid campaign data. 
          Please visit the Advertising page to connect your account.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading paid media data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meta Ads Only - No Tabs Needed */}
      <div className="space-y-6">
        <PaidMetricCards metrics={data.metrics} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaidPerformanceChart data={data.performanceData} />
          <AdSpendChart data={data.adSpendData} />
        </div>
        
        <CampaignTable campaigns={data.campaigns} platform="meta" />
      </div>
    </div>
  );
};

export default PaidReporting;

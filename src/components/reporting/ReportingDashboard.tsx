
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportingHeader from './ReportingHeader';
import { ScrollArea } from "@/components/ui/scroll-area";
import OrganicReporting from './organic/OrganicReporting';
import PaidReporting from './paid/PaidReporting';
// import InstagramAnalytics from './instagram/InstagramAnalytics';

const ReportingDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [platform, setPlatform] = useState('all');
  
  return (
    <div className="flex flex-col space-y-6">
      <ReportingHeader 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        platform={platform}
        setPlatform={setPlatform}
      />

      <Tabs defaultValue="organic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="organic">Organic Content</TabsTrigger>
          <TabsTrigger value="paid">Paid Media</TabsTrigger>
          <TabsTrigger value="modash">Modash Analytics</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="h-[calc(100vh-300px)]">
          <TabsContent value="organic" className="space-y-6">
            <OrganicReporting timeRange={timeRange} platform={platform} />
          </TabsContent>
          
          <TabsContent value="paid" className="space-y-6">
            <PaidReporting timeRange={timeRange} platform={platform} />
          </TabsContent>
          
          <TabsContent value="modash" className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Modash Analytics</h3>
              <p className="text-muted-foreground">Use Modash Discovery to find and analyze creators</p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ReportingDashboard;

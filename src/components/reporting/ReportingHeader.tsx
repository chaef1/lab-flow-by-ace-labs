
import { useState } from 'react';
import { FileBarChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReportingHeaderProps {
  timeRange: string;
  setTimeRange: (value: string) => void;
  platform: string;
  setPlatform: (value: string) => void;
}

const ReportingHeader = ({ 
  timeRange, 
  setTimeRange, 
  platform, 
  setPlatform 
}: ReportingHeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefreshData = () => {
    setIsRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Data refreshed successfully",
        description: "All metrics have been updated"
      });
    }, 1500);
  };

  const handleExportReport = () => {
    toast({
      title: "Report exported successfully",
      description: "Your report has been downloaded"
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={handleRefreshData} 
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
        
        <Button onClick={handleExportReport}>
          <FileBarChart className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

export default ReportingHeader;

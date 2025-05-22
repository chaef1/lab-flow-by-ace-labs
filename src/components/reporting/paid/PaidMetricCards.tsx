
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface PaidMetricsProps {
  metrics: {
    spend: string;
    spendChange: string;
    impressions: string;
    impressionsChange: string;
    clicks: string;
    clicksChange: string;
    ctr: string;
    ctrChange: string;
    costPerClick: string;
    costPerClickChange: string;
  };
}

const PaidMetricCards = ({ metrics }: PaidMetricsProps) => {
  const renderChangeIndicator = (change: string) => {
    const value = parseFloat(change);
    const isPositive = !change.startsWith('-');
    
    return (
      <div className={`text-sm flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
        {change}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Spend</CardTitle>
          <CardDescription>Campaign budget spent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.spend}</div>
            {renderChangeIndicator(metrics.spendChange)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Impressions</CardTitle>
          <CardDescription>Total ad views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.impressions}</div>
            {renderChangeIndicator(metrics.impressionsChange)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Clicks</CardTitle>
          <CardDescription>Total link clicks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.clicks}</div>
            {renderChangeIndicator(metrics.clicksChange)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">CTR</CardTitle>
          <CardDescription>Click-through rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.ctr}</div>
            {renderChangeIndicator(metrics.ctrChange)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Cost Per Click</CardTitle>
          <CardDescription>Average CPC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.costPerClick}</div>
            {renderChangeIndicator(metrics.costPerClickChange)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaidMetricCards;

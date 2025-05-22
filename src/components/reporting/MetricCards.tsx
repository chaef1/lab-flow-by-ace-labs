
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardsProps {
  metrics: {
    reach: string;
    reachChange: string;
    engagement: string;
    engagementChange: string;
    contentCount: number;
  };
}

const MetricCards = ({ metrics }: MetricCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Reach</CardTitle>
          <CardDescription>Combined audience reach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.reach}</div>
            <div className="text-sm text-green-500 flex items-center">
              {metrics.reachChange}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Engagement Rate</CardTitle>
          <CardDescription>Average across all content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.engagement}</div>
            <div className="text-sm text-green-500 flex items-center">
              {metrics.engagementChange}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Content Count</CardTitle>
          <CardDescription>Total pieces published</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold">{metrics.contentCount}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              This month
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricCards;

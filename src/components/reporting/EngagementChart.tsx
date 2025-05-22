
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";

interface EngagementChartProps {
  data: {
    name: string;
    likes: number;
    comments: number;
    shares: number;
  }[];
}

const EngagementChart = ({ data }: EngagementChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Breakdown</CardTitle>
        <CardDescription>Likes, comments and shares by platform</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer
          config={{
            likes: { label: "Likes", color: "#4CAF50" },
            comments: { label: "Comments", color: "#2196F3" },
            shares: { label: "Shares", color: "#FF9800" },
          }}
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="likes" fill="var(--color-likes)" name="Likes" />
            <Bar dataKey="comments" fill="var(--color-comments)" name="Comments" />
            <Bar dataKey="shares" fill="var(--color-shares)" name="Shares" />
            <ChartLegend verticalAlign="bottom" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default EngagementChart;

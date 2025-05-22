
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";

interface PaidPerformanceChartProps {
  data: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
}

const PaidPerformanceChart = ({ data }: PaidPerformanceChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>Impressions and clicks over time</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer 
          config={{
            impressions: { label: "Impressions", color: "#6366F1" },
            clicks: { label: "Clicks", color: "#F59E0B" },
          }}
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="var(--color-impressions)"
              strokeWidth={2}
              yAxisId="left"
              dot={false}
              activeDot={{ r: 6 }}
              name="Impressions"
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="var(--color-clicks)"
              strokeWidth={2}
              yAxisId="right"
              dot={false}
              activeDot={{ r: 6 }}
              name="Clicks"
            />
            <ChartLegend verticalAlign="bottom" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PaidPerformanceChart;

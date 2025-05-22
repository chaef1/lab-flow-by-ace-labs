
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";

interface PerformanceChartProps {
  data: {
    date: string;
    instagram: number;
    tiktok: number;
  }[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>Content reach over time by platform</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer 
          config={{
            instagram: { label: "Instagram", color: "#E1306C" },
            tiktok: { label: "TikTok", color: "#000000" },
          }}
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="instagram"
              stroke="var(--color-instagram)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Instagram"
            />
            <Line
              type="monotone"
              dataKey="tiktok"
              stroke="var(--color-tiktok)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="TikTok"
            />
            <ChartLegend verticalAlign="bottom" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;

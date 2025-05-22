
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";

interface AdSpendChartProps {
  data: {
    date: string;
    spend: number;
  }[];
}

const AdSpendChart = ({ data }: AdSpendChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad Spend</CardTitle>
        <CardDescription>Daily campaign spending</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer 
          config={{
            spend: { label: "Spend", color: "#10B981" },
          }}
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />} 
              formatter={(value) => [`$${value}`, 'Spend']}
            />
            <Bar 
              dataKey="spend" 
              fill="var(--color-spend)" 
              name="Spend" 
              radius={[4, 4, 0, 0]} 
            />
            <ChartLegend verticalAlign="bottom" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AdSpendChart;

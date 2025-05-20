
import { useState, useMemo, Suspense } from 'react';
import DashboardLayout from '@/components/layout/Dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Loader } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { toast } from "@/hooks/use-toast";
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ReportingContent = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [platform, setPlatform] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  });

  // Mock data for demonstrations
  const contentPerformanceData = [
    { date: 'May 1', instagram: 2400, tiktok: 1800 },
    { date: 'May 5', instagram: 3200, tiktok: 4800 },
    { date: 'May 10', instagram: 5000, tiktok: 7200 },
    { date: 'May 15', instagram: 4780, tiktok: 8900 },
    { date: 'May 20', instagram: 5890, tiktok: 9100 },
    { date: 'May 25', instagram: 6390, tiktok: 9800 },
    { date: 'May 30', instagram: 7490, tiktok: 12000 },
  ];

  const engagementData = [
    { name: 'Instagram', likes: 4300, comments: 980, shares: 1500 },
    { name: 'TikTok', likes: 9800, comments: 2300, shares: 5400 }
  ];

  const topPerformingContent = [
    {
      id: '1',
      platform: 'Instagram',
      title: 'Product Launch Video',
      creator: 'Sarah Johnson',
      reach: '45.2K',
      engagement: '8.7%',
      date: 'May 15, 2025',
      link: 'https://instagram.com/p/example1'
    },
    {
      id: '2',
      platform: 'TikTok',
      title: 'Brand Challenge',
      creator: 'Mike Chen',
      reach: '120K',
      engagement: '12.3%',
      date: 'May 12, 2025',
      link: 'https://tiktok.com/@example/video2'
    },
    {
      id: '3',
      platform: 'Instagram',
      title: 'Customer Story',
      creator: 'Emma Wilson',
      reach: '38.9K',
      engagement: '7.2%',
      date: 'May 18, 2025',
      link: 'https://instagram.com/p/example3'
    },
    {
      id: '4',
      platform: 'TikTok',
      title: 'Product Tutorial',
      creator: 'Alex Davis',
      reach: '87.5K',
      engagement: '9.8%',
      date: 'May 20, 2025',
      link: 'https://tiktok.com/@example/video4'
    },
    {
      id: '5',
      platform: 'Instagram',
      title: 'Behind the Scenes',
      creator: 'Jordan Smith',
      reach: '29.4K',
      engagement: '6.5%',
      date: 'May 22, 2025',
      link: 'https://instagram.com/p/example5'
    },
  ];

  const creatorStats = [
    {
      id: '1',
      name: 'Sarah Johnson',
      instagram: '@sarahjcreates',
      tiktok: '@sarahj',
      followers: '524K',
      engagement: '8.2%',
      posts: 12,
      performance: 'High'
    },
    {
      id: '2',
      name: 'Mike Chen',
      instagram: '@mikechentech',
      tiktok: '@mikechen',
      followers: '1.2M',
      engagement: '7.8%',
      posts: 9,
      performance: 'High'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      instagram: '@emmawilson',
      tiktok: '@emmadesigns',
      followers: '342K',
      engagement: '5.6%',
      posts: 14,
      performance: 'Medium'
    },
    {
      id: '4',
      name: 'Alex Davis',
      instagram: '@alex.davis',
      tiktok: '@alexd',
      followers: '895K',
      engagement: '9.1%',
      posts: 8,
      performance: 'High'
    },
    {
      id: '5',
      name: 'Jordan Smith',
      instagram: '@jordansmith',
      tiktok: '@jordancreates',
      followers: '267K',
      engagement: '4.9%',
      posts: 11,
      performance: 'Medium'
    },
  ];

  // Filter top content based on selected platform
  const filteredContent = useMemo(() => {
    if (platform === 'all') return topPerformingContent;
    return topPerformingContent.filter(item => 
      item.platform.toLowerCase() === platform.toLowerCase()
    );
  }, [platform, topPerformingContent]);

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

  const getPerformanceBadgeColor = (performance: string) => {
    switch (performance.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'low':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading reporting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Reach</CardTitle>
            <CardDescription>Combined audience reach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">1.42M</div>
              <div className="text-sm text-green-500 flex items-center">
                +12.5%
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
              <div className="text-3xl font-bold">8.7%</div>
              <div className="text-sm text-green-500 flex items-center">
                +2.1%
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
              <div className="text-3xl font-bold">54</div>
              <div className="text-sm text-muted-foreground flex items-center">
                This month
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="creators">Creator Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
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
                <LineChart data={contentPerformanceData}>
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
                  <Legend content={<ChartLegend verticalAlign="bottom" />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
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
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="likes" fill="var(--color-likes)" name="Likes" />
                  <Bar dataKey="comments" fill="var(--color-comments)" name="Comments" />
                  <Bar dataKey="shares" fill="var(--color-shares)" name="Shares" />
                  <Legend content={<ChartLegend verticalAlign="bottom" />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Content with highest engagement and reach</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Reach</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {content.platform === 'Instagram' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram mr-2 text-pink-500">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 448 512" className="mr-2">
                                <path fill="currentColor" d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                              </svg>
                            )}
                            {content.platform}
                          </div>
                        </TableCell>
                        <TableCell>{content.title}</TableCell>
                        <TableCell>{content.creator}</TableCell>
                        <TableCell>{content.reach}</TableCell>
                        <TableCell>{content.engagement}</TableCell>
                        <TableCell>{content.date}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <a href={content.link} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="creators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator Performance</CardTitle>
              <CardDescription>Analytics by creator across all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Instagram</TableHead>
                      <TableHead>TikTok</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Engagement Rate</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creatorStats.map((creator) => (
                      <TableRow key={creator.id}>
                        <TableCell className="font-medium">{creator.name}</TableCell>
                        <TableCell>{creator.instagram}</TableCell>
                        <TableCell>{creator.tiktok}</TableCell>
                        <TableCell>{creator.followers}</TableCell>
                        <TableCell>{creator.engagement}</TableCell>
                        <TableCell>{creator.posts}</TableCell>
                        <TableCell>
                          <Badge className={getPerformanceBadgeColor(creator.performance)}>
                            {creator.performance}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Reporting = () => {
  return (
    <DashboardLayout title="Campaign Reporting" subtitle="Track campaign performance and creator content">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading reporting dashboard...</p>
            </div>
          </div>
        }>
          <ReportingContent />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default Reporting;

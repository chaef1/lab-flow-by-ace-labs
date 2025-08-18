import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search,
  Bell,
  TrendingUp,
  Eye,
  Hash,
  AlertTriangle,
  Settings,
  BarChart3,
  Users,
  Instagram,
  Youtube,
  Music,
  ExternalLink,
  Calendar,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const platformIcons = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
};

interface BrandMonitor {
  id: string;
  name: string;
  rules_json: any;
  schedule: string;
  is_active: boolean;
  created_at: string;
  owners: string[];
}

interface MonitorHit {
  id: string;
  monitor_id: string;
  platform: string;
  creator_id: string;
  post_id?: string;
  hit_type: string;
  content_preview?: string;
  metrics: any;
  confidence_score: number;
  hit_at: string;
}

const BrandMonitoring = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch monitors
  const { data: monitors, isLoading: monitorsLoading, refetch: refetchMonitors } = useQuery({
    queryKey: ['brand-monitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_monitors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BrandMonitor[];
    },
  });

  // Fetch monitor hits
  const { data: hits, isLoading: hitsLoading } = useQuery({
    queryKey: ['monitor-hits', selectedMonitor],
    queryFn: async () => {
      let query = supabase
        .from('brand_monitor_hits')
        .select('*')
        .order('hit_at', { ascending: false })
        .limit(100);
        
      if (selectedMonitor && selectedMonitor !== 'all') {
        query = query.eq('monitor_id', selectedMonitor);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MonitorHit[];
    },
    enabled: !!monitors
  });

  // Create monitor mutation
  const createMonitorMutation = useMutation({
    mutationFn: async (monitorData: any) => {
      const { data, error } = await supabase
        .from('brand_monitors')
        .insert({
          name: monitorData.name,
          rules_json: monitorData.rules,
          schedule: monitorData.schedule,
          created_by: userProfile?.id,
          owners: [userProfile?.id]
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Monitor created",
        description: "Your brand monitor has been set up successfully",
      });
      setIsCreateOpen(false);
      refetchMonitors();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create monitor",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Mock data for charts (replace with real data)
  const mentionsOverTime = [
    { date: '2024-01-01', mentions: 45 },
    { date: '2024-01-02', mentions: 52 },
    { date: '2024-01-03', mentions: 38 },
    { date: '2024-01-04', mentions: 67 },
    { date: '2024-01-05', mentions: 43 },
    { date: '2024-01-06', mentions: 89 },
    { date: '2024-01-07', mentions: 71 },
  ];

  const topPlatforms = [
    { platform: 'Instagram', mentions: 156, reach: 2450000 },
    { platform: 'TikTok', mentions: 89, reach: 1890000 },
    { platform: 'YouTube', mentions: 34, reach: 890000 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Brand Monitoring</h1>
              <p className="text-muted-foreground">Track mentions, competitors, and brand insights across social platforms</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Monitor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Brand Monitor</DialogTitle>
                </DialogHeader>
                <CreateMonitorForm onSubmit={createMonitorMutation.mutate} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Monitor Selector */}
          <div className="flex items-center gap-4">
            <Select value={selectedMonitor || 'all'} onValueChange={setSelectedMonitor}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select monitor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Monitors</SelectItem>
                {monitors?.map((monitor) => (
                  <SelectItem key={monitor.id} value={monitor.id}>
                    {monitor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {monitors?.filter(m => m.is_active).length || 0} Active
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {hits?.length || 0} Mentions Today
              </Badge>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Mentions</p>
                    <p className="text-2xl font-bold">1,247</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% from last week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Hash className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Reach</p>
                    <p className="text-2xl font-bold">5.2M</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +8% from last week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Engagement</p>
                    <p className="text-2xl font-bold">3.8%</p>
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 rotate-180" />
                      -2% from last week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Creators Mentioning</p>
                    <p className="text-2xl font-bold">89</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +15 new this week
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="creators">Creators</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mentions Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mentions Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={mentionsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="mentions" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Platform Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topPlatforms}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="platform" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="mentions" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Active Monitors */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Monitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monitors?.map((monitor) => (
                      <div key={monitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${monitor.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <h4 className="font-medium">{monitor.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {monitor.rules_json.keywords?.length || 0} keywords • 
                              {monitor.rules_json.platforms?.length || 0} platforms • 
                              {monitor.schedule} updates
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {Math.floor(Math.random() * 50)} mentions today
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Mentions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hits?.slice(0, 10).map((hit) => {
                      const PlatformIcon = platformIcons[hit.platform as keyof typeof platformIcons];
                      return (
                        <div key={hit.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {hit.creator_id?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">@{hit.creator_id}</span>
                              <Badge variant="outline" className="text-xs">
                                {hit.hit_type}
                              </Badge>
                              <Badge variant={hit.confidence_score > 0.8 ? 'default' : 'secondary'} className="text-xs">
                                {Math.round(hit.confidence_score * 100)}% match
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {hit.content_preview || 'No preview available'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{new Date(hit.hit_at).toLocaleDateString()}</span>
                              {hit.metrics.likes && (
                                <span>{formatNumber(hit.metrics.likes)} likes</span>
                              )}
                              {hit.metrics.views && (
                                <span>{formatNumber(hit.metrics.views)} views</span>
                              )}
                            </div>
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creators" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Creators Mentioning Your Brand</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Creator analytics coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Competitor tracking coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Create Monitor Form Component
const CreateMonitorForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    hashtags: '',
    competitors: '',
    platforms: [] as string[],
    countries: [] as string[],
    minFollowers: 1000,
    schedule: 'daily',
    emailAlerts: true,
    includeWatchlist: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rules = {
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(Boolean),
      competitors: formData.competitors.split(',').map(c => c.trim()).filter(Boolean),
      platforms: formData.platforms,
      countries: formData.countries,
      minFollowers: formData.minFollowers,
      includeWatchlist: formData.includeWatchlist,
    };

    onSubmit({
      name: formData.name,
      rules,
      schedule: formData.schedule,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Monitor Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Nike Brand Mentions"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="keywords">Brand Keywords</Label>
          <Textarea
            id="keywords"
            value={formData.keywords}
            onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
            placeholder="nike, swoosh, just do it"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="hashtags">Hashtags</Label>
          <Textarea
            id="hashtags"
            value={formData.hashtags}
            onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
            placeholder="#nike, #justdoit, #swoosh"
            rows={3}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="platforms">Platforms</Label>
        <div className="flex gap-4 mt-2">
          {['instagram', 'youtube', 'tiktok'].map(platform => (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={platform}
                checked={formData.platforms.includes(platform)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                  } else {
                    setFormData(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                  }
                }}
              />
              <Label htmlFor={platform} className="capitalize">{platform}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minFollowers">Minimum Followers</Label>
          <Input
            id="minFollowers"
            type="number"
            value={formData.minFollowers}
            onChange={(e) => setFormData(prev => ({ ...prev, minFollowers: parseInt(e.target.value) }))}
          />
        </div>
        
        <div>
          <Label htmlFor="schedule">Update Frequency</Label>
          <Select value={formData.schedule} onValueChange={(value) => setFormData(prev => ({ ...prev, schedule: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="emailAlerts"
          checked={formData.emailAlerts}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailAlerts: !!checked }))}
        />
        <Label htmlFor="emailAlerts">Send email alerts for new mentions</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Create Monitor</Button>
      </div>
    </form>
  );
};

export default BrandMonitoring;
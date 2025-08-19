import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Instagram,
  Music,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const statusColors = {
  prospect: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800', 
  negotiating: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800'
};

const CampaignWorkspace = () => {
  const { userProfile } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pipeline');

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch campaign creators
  const { data: campaignCreators } = useQuery({
    queryKey: ['campaign-creators', selectedCampaign],
    queryFn: async () => {
      let query = supabase
        .from('campaign_workspace_creators')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (selectedCampaign !== 'all') {
        query = query.eq('workspace_id', selectedCampaign);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Campaign Workspace</h1>
              <p className="text-muted-foreground">Manage creator campaigns, outreach, and collaborations</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
                </div>
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Creators in Pipeline</p>
                  <p className="text-2xl font-bold">{campaignCreators?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed Creators</p>
                  <p className="text-2xl font-bold">
                    {campaignCreators?.filter(c => c.stage === 'confirmed').length || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Outreach</p>
                  <p className="text-2xl font-bold">
                    {campaignCreators?.filter(c => c.stage === 'prospect').length || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="pipeline">Creator Pipeline</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {campaignCreators && campaignCreators.length > 0 ? (
                  <div className="space-y-4">
                    {campaignCreators.map((creator) => (
                      <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={(creator.snapshot_json as any)?.profilePicUrl} />
                            <AvatarFallback>
                              {creator.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">@{creator.username}</h4>
                              {creator.platform === 'instagram' && <Instagram className="w-4 h-4" />}
                              {creator.platform === 'tiktok' && <Music className="w-4 h-4" />}
                              {(creator.snapshot_json as any)?.isVerified && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {(creator.snapshot_json as any)?.fullName || (creator.snapshot_json as any)?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {((creator.snapshot_json as any)?.followers || 0).toLocaleString()} followers
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline" 
                            className={statusColors[creator.stage as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                          >
                            {creator.stage}
                          </Badge>
                          
                          {creator.price_quoted && (
                            <div className="text-right">
                              <p className="text-sm font-medium">${creator.price_quoted}</p>
                              <p className="text-xs text-muted-foreground">quoted</p>
                            </div>
                          )}
                          
                          <div className="flex gap-1">
                            {creator.contact_email && (
                              <Button variant="ghost" size="sm">
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Creators in Pipeline</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start by discovering creators and adding them to your campaigns
                    </p>
                    <Button asChild>
                      <a href="/discover">Discover Creators</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Management</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns && campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {campaign.start_date ? formatDate(campaign.start_date) : 'No start date'}
                            </span>
                            {campaign.total_budget && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${campaign.total_budget.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first campaign to start collaborating with creators
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
                  <p className="text-sm">
                    Campaign performance metrics will appear here once campaigns are active
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CampaignWorkspace;
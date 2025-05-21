import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  getMetaCampaigns, 
  getSavedMetaToken, 
  getMetaAdAccounts, 
  getTikTokCampaigns, 
  getSavedTikTokToken,
  createMetaCampaign,
  getMetaAudiences,
  createMetaAdSet,
  createMetaAd
} from "@/lib/ads-api";
import { AlertCircle, Trash, Edit, Pause, Play, RefreshCw, MoreHorizontal, Filter, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CampaignCreatorProps {
  platform: 'tiktok' | 'meta';
  isConnected?: boolean;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  budget: number;
  startDate?: string;
  endDate?: string;
  creatives?: number;
  insights?: any;
  spend?: string;
}

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ platform, isConnected = false }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realCampaigns, setRealCampaigns] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      name: '',
      objective: '',
      budget: 500,
      budgetType: 'daily',
      startDate: '',
      endDate: '',
      targetAudience: '',
      description: ''
    }
  });

  // Fetch real campaigns when platform or connection status changes
  useEffect(() => {
    if (isConnected) {
      fetchRealCampaigns();
    }
  }, [platform, isConnected]);

  // Fetch audiences when platform changes and connected
  useEffect(() => {
    if (platform === 'meta' && isConnected) {
      fetchMetaAudiences();
    }
  }, [platform, isConnected]);

  // Function to fetch Meta audiences
  const fetchMetaAudiences = async () => {
    try {
      const { accessToken, accountId } = getSavedMetaToken();
      
      if (accessToken && accountId) {
        const audiencesData = await getMetaAudiences(accessToken, accountId);
        
        if (audiencesData && audiencesData.data) {
          setAudiences(audiencesData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching Meta audiences:', error);
    }
  };

  // Function to fetch real campaigns from the selected platform
  const fetchRealCampaigns = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      if (platform === 'meta') {
        const { accessToken, accountId } = getSavedMetaToken();
        
        if (accessToken && accountId) {
          console.log('Fetching Meta campaigns for account:', accountId);
          const campaignsData = await getMetaCampaigns(accessToken, accountId);
          
          if (campaignsData && campaignsData.data) {
            console.log('Meta campaigns fetched:', campaignsData.data);
            
            // Transform the campaign data into a more usable format
            const transformedCampaigns = campaignsData.data.map((campaign: any) => ({
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective || 'Not specified',
              status: campaign.status || 'ACTIVE',
              budget: parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0') / 100, // Convert from cents to dollars
              startDate: campaign.start_time,
              endDate: campaign.stop_time,
              spend: campaign.spend || '0',
              insights: campaign.insights ? campaign.insights.data[0] : null
            }));
            
            setRealCampaigns(transformedCampaigns);
            setCampaigns([]); // Clear sample campaigns
          }
        }
      } else if (platform === 'tiktok') {
        const { accessToken, advertiserId } = getSavedTikTokToken();
        
        if (accessToken && advertiserId) {
          console.log('Fetching TikTok campaigns for advertiser:', advertiserId);
          const campaignsData = await getTikTokCampaigns(accessToken, advertiserId);
          
          if (campaignsData && campaignsData.data && campaignsData.data.list) {
            console.log('TikTok campaigns fetched:', campaignsData.data.list);
            setRealCampaigns(campaignsData.data.list);
          }
        }
      }
    } catch (error: any) {
      console.error(`Error fetching ${platform} campaigns:`, error);
      setError(`Failed to fetch ${platform} campaigns. Please try again.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleCreateCampaign = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Different handling based on platform
      if (platform === 'meta') {
        // Get Meta token and account ID
        const { accessToken, accountId } = getSavedMetaToken();
        
        if (!accessToken || !accountId) {
          throw new Error('Meta authentication required. Please connect your Meta account first.');
        }
        
        // Prepare the campaign data
        const campaignData = {
          name: data.name,
          objective: data.objective,
          status: 'PAUSED', // Start as paused for safety
          specialAdCategories: [],
          startTime: data.startDate ? new Date(data.startDate).toISOString() : undefined,
          endTime: data.endDate ? new Date(data.endDate).toISOString() : undefined
        };
        
        // Add budget based on budget type
        if (data.budgetType === 'daily') {
          campaignData['dailyBudget'] = data.budget;
        } else {
          campaignData['lifetimeBudget'] = data.budget;
        }
        
        console.log('Creating Meta campaign with data:', campaignData);
        
        // Call the API to create the campaign
        const campaignResult = await createMetaCampaign(accessToken, accountId, campaignData);
        
        if (!campaignResult || !campaignResult.id) {
          throw new Error('Failed to create campaign. Please try again.');
        }
        
        const campaignId = campaignResult.id;
        console.log('Campaign created successfully with ID:', campaignId);
        
        // Create ad set with targeting
        const adSetData = {
          name: `${data.name} - Ad Set`,
          campaignId: campaignId,
          optimizationGoal: data.objective === 'AWARENESS' ? 'REACH' : 
                            data.objective === 'TRAFFIC' ? 'LINK_CLICKS' : 
                            'CONVERSIONS',
          billingEvent: data.objective === 'AWARENESS' ? 'IMPRESSIONS' : 'IMPRESSIONS',
          dailyBudget: data.budgetType === 'daily' ? data.budget : undefined,
          lifetimeBudget: data.budgetType === 'lifetime' ? data.budget : undefined,
          startTime: data.startDate ? new Date(data.startDate).toISOString() : undefined,
          endTime: data.endDate ? new Date(data.endDate).toISOString() : undefined,
          targeting: {
            age_min: 18,
            age_max: 65,
            genders: [1, 2], // All genders
            geo_locations: {
              countries: ['US', 'CA'] // Default targeting
            }
          }
        };
        
        if (data.targetAudience && data.targetAudience !== 'All') {
          // If custom audience selected, add it to targeting
          adSetData.targeting['custom_audiences'] = [{id: data.targetAudience}];
        }
        
        console.log('Creating ad set with data:', adSetData);
        
        // Create the ad set
        const adSetResult = await createMetaAdSet(accessToken, accountId, adSetData);
        
        if (adSetResult && adSetResult.id) {
          console.log('Ad set created successfully with ID:', adSetResult.id);
          
          toast({
            title: "Campaign Created",
            description: `Your Meta campaign "${data.name}" has been created successfully.`,
          });
        }
        
        // Refresh the campaign list to show the new campaign
        fetchRealCampaigns();
      } else if (platform === 'tiktok') {
        // Get TikTok token and advertiser ID
        const { accessToken, advertiserId } = getSavedTikTokToken();
        
        if (!accessToken || !advertiserId) {
          throw new Error('TikTok authentication required. Please connect your TikTok account first.');
        }
        
        console.log('Creating TikTok campaign with data:', {
          ...data,
          advertiserId,
          platform: 'tiktok'
        });
        
        // For now, we're just creating a simulated campaign until the real API integration is complete
        const newCampaign = {
          id: `tiktok-${Date.now()}`,
          name: data.name,
          objective: data.objective,
          budget: data.budget,
          status: 'Draft',
          startDate: data.startDate,
          endDate: data.endDate,
          creatives: 0
        };
        
        setCampaigns([...campaigns, newCampaign]);
        
        toast({
          title: "TikTok Campaign Created",
          description: "Your TikTok campaign has been created successfully (simulated).",
        });
      }
      
      setIsDialogOpen(false);
      form.reset();
      
      // Refresh the campaign list to show new campaign
      fetchRealCampaigns();
      
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      setError(error.message || 'Failed to create campaign');
      
      toast({
        title: "Campaign Creation Failed",
        description: error.message || "There was an error creating your campaign.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateCampaignStatus = async (campaignId: string, newStatus: string) => {
    // This would be implemented to toggle campaign status
    toast({
      title: "Campaign Status Update",
      description: `Campaign status updated to ${newStatus}`,
    });
    
    // Refresh campaigns after update
    fetchRealCampaigns();
  };
  
  // Filter campaigns based on active tab
  const filteredCampaigns = realCampaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return campaign.status === 'ACTIVE';
    if (activeTab === 'paused') return campaign.status === 'PAUSED';
    if (activeTab === 'draft') return campaign.status === 'DRAFT';
    return true;
  });
  
  // Render function for campaign list or empty state
  const renderCampaignList = () => {
    if (!isConnected) {
      return (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
          <h3 className="text-lg font-medium mb-2">Connect Your {platform === 'meta' ? 'Meta' : 'TikTok'} Account</h3>
          <p className="text-center text-muted-foreground mb-4">
            Please connect your {platform === 'meta' ? 'Meta' : 'TikTok'} account to view and manage your campaigns
          </p>
        </div>
      );
    }
  
    if (isLoading && !isRefreshing) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (filteredCampaigns.length > 0) {
      return (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign: any) => (
            <Card key={campaign.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      Objective: {platform === 'meta' ? campaign.objective : campaign.objective_type || 'Not specified'}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    (campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'default' : 
                    (campaign.status === 'Scheduled' || campaign.status === 'PAUSED') ? 'secondary' :
                    'outline'
                  }>
                    {campaign.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget/Spend</p>
                    <p className="text-xl font-bold">
                      ${campaign.budget?.toFixed(2) || '0.00'} / ${platform === 'meta' ? 
                        (parseFloat(campaign.spend || '0') || 0).toFixed(2) : 
                        (parseFloat(campaign.budget || '0') || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="text-base">{campaign.id || campaign.campaign_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.startDate ? 'Duration' : 'Created'}
                    </p>
                    <p className="text-base">
                      {campaign.startDate && campaign.endDate ? 
                        `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` : 
                        (campaign.created_time ? new Date(campaign.created_time).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                </div>
                
                {campaign.insights && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium mb-2">Performance Metrics</p>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-medium">{campaign.insights.impressions || '0'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clicks</p>
                        <p className="font-medium">{campaign.insights.clicks || '0'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-medium">{campaign.insights.ctr || '0%'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost/Result</p>
                        <p className="font-medium">${campaign.insights.cost_per_result || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Details</Button>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Campaign Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => toast({title: "Editing", description: "Opening campaign editor"})}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({title: "Duplicating", description: "Duplicating campaign"})}>
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8" y="8" width="12" height="12" rx="2" />
                          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                        </svg> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {campaign.status === 'ACTIVE' ? (
                        <DropdownMenuItem onClick={() => handleUpdateCampaignStatus(campaign.id, 'PAUSED')}>
                          <Pause className="mr-2 h-4 w-4" /> Pause Campaign
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUpdateCampaignStatus(campaign.id, 'ACTIVE')}>
                          <Play className="mr-2 h-4 w-4" /> Activate Campaign
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast({title: "Exporting", description: "Exporting campaign data"})}>
                        <Download className="mr-2 h-4 w-4" /> Export Data
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => toast({title: "Deleting", description: "Deleting campaign"})}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant={(campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'destructive' : 'default'} 
                    size="sm"
                    onClick={() => handleUpdateCampaignStatus(
                      campaign.id, 
                      (campaign.status === 'ACTIVE') ? 'PAUSED' : 'ACTIVE'
                    )}
                  >
                    {(campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'Pause' : 
                     (campaign.status === 'Scheduled' || campaign.status === 'PAUSED') ? 'Activate' : 
                     'Activate'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    // If no real campaigns, show the sample campaigns or empty state
    if (campaigns.length > 0) {
      return (
        <div className="grid gap-4">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>Objective: {campaign.objective}</CardDescription>
                  </div>
                  <Badge variant={
                    campaign.status === 'Active' ? 'default' : 
                    campaign.status === 'Scheduled' ? 'secondary' :
                    'outline'
                  }>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-xl font-bold">${campaign.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-base">
                      {campaign.startDate && campaign.endDate ? 
                        `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Creatives</p>
                    <p className="text-base">{campaign.creatives} assets</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Details</Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant={campaign.status === 'Active' ? 'destructive' : 'default'} size="sm">
                    {campaign.status === 'Active' ? 'Pause' : campaign.status === 'Scheduled' ? 'Cancel' : 'Activate'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    // Empty state
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
        <h3 className="text-lg font-medium mb-2">No Campaigns Created Yet</h3>
        <p className="text-center text-muted-foreground mb-4">
          Create your first {platform === 'meta' ? 'Meta' : 'TikTok'} advertising campaign to start promoting your content
        </p>
        <Button onClick={() => setIsDialogOpen(true)}>Create Campaign</Button>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Campaign filtering and management */}
      {isConnected && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={fetchRealCampaigns} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      )}
      
      {/* Campaign List Section */}
      {renderCampaignList()}
      
      {/* Create Campaign Dialog */}
      {isConnected && (
        <div className="flex justify-center mt-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create New Campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New {platform === 'meta' ? 'Meta' : 'TikTok'} Campaign</DialogTitle>
                <DialogDescription>
                  Set up your advertising campaign for {platform === 'meta' ? 'Facebook/Instagram' : 'TikTok'}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateCampaign)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Summer Product Launch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="objective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Objective</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select objective" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {platform === 'meta' ? (
                                <>
                                  <SelectItem value="AWARENESS">Brand Awareness</SelectItem>
                                  <SelectItem value="REACH">Reach</SelectItem>
                                  <SelectItem value="TRAFFIC">Traffic</SelectItem>
                                  <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                                  <SelectItem value="CONVERSIONS">Conversions</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="Conversions">Conversions</SelectItem>
                                  <SelectItem value="Reach">Reach & Awareness</SelectItem>
                                  <SelectItem value="Traffic">Traffic</SelectItem>
                                  <SelectItem value="Engagement">Engagement</SelectItem>
                                  <SelectItem value="VideoViews">Video Views</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="budgetType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Budget type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily Budget</SelectItem>
                              <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (USD)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              defaultValue={[field.value]}
                              min={100}
                              max={5000}
                              step={100}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="py-4"
                            />
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">$100</span>
                              <span className="text-sm font-medium">${field.value}</span>
                              <span className="text-sm text-muted-foreground">$5000</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {platform === 'meta' && audiences.length > 0 ? (
                              audiences.map(audience => (
                                <SelectItem key={audience.id} value={audience.id}>
                                  {audience.name} ({audience.approximate_count || 'Unknown size'})
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="All">All Users</SelectItem>
                                <SelectItem value="Youth">Youth (18-24)</SelectItem>
                                <SelectItem value="YoungAdults">Young Adults (25-34)</SelectItem>
                                <SelectItem value="Adults">Adults (35-44)</SelectItem>
                                <SelectItem value="Seniors">Seniors (45+)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {platform === 'meta' && audiences.length > 0 
                            ? 'Select a custom audience from your Meta account' 
                            : 'Select the demographics you want to target'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the goals and strategy for this campaign" 
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                          Creating...
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default CampaignCreator;

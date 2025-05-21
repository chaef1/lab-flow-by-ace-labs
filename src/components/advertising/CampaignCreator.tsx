
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
import { getMetaCampaigns, getSavedMetaToken, getMetaAdAccounts, getTikTokCampaigns, getSavedTikTokToken } from "@/lib/ads-api";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CampaignCreatorProps {
  platform: 'tiktok' | 'meta';
}

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ platform }) => {
  const [campaigns, setCampaigns] = useState([
    { 
      id: '1', 
      name: 'Summer Product Launch', 
      objective: 'Conversions', 
      budget: 1000, 
      status: 'Active',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      creatives: 3
    },
    { 
      id: '2', 
      name: 'Brand Awareness Q2', 
      objective: 'Reach', 
      budget: 2500, 
      status: 'Scheduled',
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      creatives: 2
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realCampaigns, setRealCampaigns] = useState<any[]>([]);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      name: '',
      objective: '',
      budget: 500,
      startDate: '',
      endDate: '',
      targetAudience: '',
      description: ''
    }
  });

  // Fetch real campaigns when platform or component mounts
  useEffect(() => {
    fetchRealCampaigns();
  }, [platform]);

  // Function to fetch real campaigns from the selected platform
  const fetchRealCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (platform === 'meta') {
        const { accessToken, accountId } = getSavedMetaToken();
        
        if (accessToken && accountId) {
          console.log('Fetching Meta campaigns for account:', accountId);
          const campaignsData = await getMetaCampaigns(accessToken, accountId);
          
          if (campaignsData && campaignsData.data) {
            console.log('Meta campaigns fetched:', campaignsData.data);
            setRealCampaigns(campaignsData.data);
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
    } catch (error) {
      console.error(`Error fetching ${platform} campaigns:`, error);
      setError(`Failed to fetch ${platform} campaigns. Please try again.`);
    } finally {
      setIsLoading(false);
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
        
        // This is where we would normally call the Meta API to create a real campaign
        // For now, we'll simulate a successful campaign creation with a delay
        console.log('Creating Meta campaign with data:', {
          ...data,
          accountId,
          platform: 'meta'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        // For now, we're just creating a simulated campaign until the real API integration is complete
        const newCampaign = {
          id: `meta-${Date.now()}`,
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
          title: "Meta Campaign Created",
          description: "Your Meta campaign has been created successfully (simulated).",
        });
        
        // In a real implementation, we would create the campaign via the Meta API
        // const result = await createMetaCampaign(accessToken, accountId, data);
        // Then handle the result accordingly
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
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
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
  
  // Render function for campaign list or empty state
  const renderCampaignList = () => {
    if (isLoading) {
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
    
    if (realCampaigns.length > 0) {
      return (
        <div className="grid gap-4">
          {/* Display real campaigns from the API when available */}
          {realCampaigns.map((campaign: any) => (
            <Card key={campaign.id || campaign.campaign_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      {platform === 'meta' ? `Objective: ${campaign.objective || 'Not specified'}` : 
                       `Objective: ${campaign.objective_type || 'Not specified'}`}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    (campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'default' : 
                    (campaign.status === 'Scheduled' || campaign.status === 'SCHEDULED') ? 'secondary' :
                    'outline'
                  }>
                    {campaign.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-xl font-bold">
                      ${platform === 'meta' ? 
                        (parseFloat(campaign.spend || '0') || 0).toFixed(2) : 
                        (parseFloat(campaign.budget || '0') || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="text-base">{campaign.id || campaign.campaign_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-base">
                      {campaign.created_time ? new Date(campaign.created_time).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Details</Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button 
                    variant={(campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'destructive' : 'default'} 
                    size="sm"
                  >
                    {(campaign.status === 'Active' || campaign.status === 'ACTIVE') ? 'Pause' : 
                     (campaign.status === 'Scheduled' || campaign.status === 'SCHEDULED') ? 'Cancel' : 'Activate'}
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
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
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
      {/* Campaign List Section */}
      {renderCampaignList()}
      
      {/* Create Campaign Dialog */}
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
                </div>
                
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
                          <SelectItem value="All">All Users</SelectItem>
                          <SelectItem value="Youth">Youth (18-24)</SelectItem>
                          <SelectItem value="YoungAdults">Young Adults (25-34)</SelectItem>
                          <SelectItem value="Adults">Adults (35-44)</SelectItem>
                          <SelectItem value="Seniors">Seniors (45+)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the demographics you want to target
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
    </div>
  );
};

export default CampaignCreator;

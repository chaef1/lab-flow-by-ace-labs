
import React, { useState } from 'react';
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
  
  const handleCreateCampaign = (data: any) => {
    const newCampaign = {
      id: (campaigns.length + 1).toString(),
      name: data.name,
      objective: data.objective,
      budget: data.budget,
      status: 'Draft',
      startDate: data.startDate,
      endDate: data.endDate,
      creatives: 0
    };
    
    setCampaigns([...campaigns, newCampaign]);
    setIsDialogOpen(false);
    form.reset();
  };
  
  return (
    <div className="space-y-6">
      {campaigns.length > 0 ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
          <h3 className="text-lg font-medium mb-2">No Campaigns Created Yet</h3>
          <p className="text-center text-muted-foreground mb-4">
            Create your first advertising campaign to start promoting your content
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>Create Campaign</Button>
        </div>
      )}
      
      <div className="flex justify-center mt-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up your advertising campaign for TikTok
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
                            <SelectItem value="Conversions">Conversions</SelectItem>
                            <SelectItem value="Reach">Reach & Awareness</SelectItem>
                            <SelectItem value="Traffic">Traffic</SelectItem>
                            <SelectItem value="Engagement">Engagement</SelectItem>
                            <SelectItem value="VideoViews">Video Views</SelectItem>
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
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Campaign</Button>
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

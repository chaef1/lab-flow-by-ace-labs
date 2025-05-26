import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, Image, DollarSign } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PageSelector from './PageSelector';
import CreativeUpload from './CreativeUpload';
import AccountSelector from './AccountSelector';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  objective: z.string().min(1, 'Objective is required'),
  budget: z.number().min(1, 'Budget must be at least $1'),
  budgetType: z.enum(['daily', 'lifetime']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface CampaignFormProps {
  platform: 'meta';
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
  audiences?: any[];
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  platform,
  onSubmit,
  isLoading,
  onCancel,
  audiences = []
}) => {
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [uploadedCreatives, setUploadedCreatives] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('basics');

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      objective: '',
      budget: 10,
      budgetType: 'daily',
      startDate: '',
      endDate: '',
    },
  });

  const handleCreativeUploaded = (creative: any) => {
    setUploadedCreatives(prev => [...prev, creative]);
  };

  const handleCreativeRemoved = (creativeId: string) => {
    setUploadedCreatives(prev => prev.filter(c => c.id !== creativeId));
  };

  const handleSubmit = (values: z.infer<typeof campaignSchema>) => {
    if (!selectedAccount) {
      alert('Please select an ad account');
      return;
    }

    if (!selectedPage) {
      alert('Please select a Facebook page');
      return;
    }

    if (uploadedCreatives.length === 0) {
      alert('Please upload at least one creative');
      return;
    }

    const formData = {
      ...values,
      selectedAccount,
      selectedPage,
      creatives: uploadedCreatives,
      targeting: {
        age_min: 18,
        age_max: 65,
        genders: [1, 2],
        geo_locations: {
          countries: ['ZA']
        }
      }
    };

    onSubmit(formData);
  };

  const objectiveOptions = [
    { value: 'OUTCOME_AWARENESS', label: 'Awareness - Reach people most likely to remember your ads' },
    { value: 'OUTCOME_TRAFFIC', label: 'Traffic - Send people to your website or app' },
    { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement - Get more post engagements, Page likes, or event responses' },
    { value: 'OUTCOME_LEADS', label: 'Leads - Collect leads for your business' },
    { value: 'OUTCOME_SALES', label: 'Sales - Find people likely to purchase your products' },
  ];

  const canProceedToTargeting = form.watch('name') && form.watch('objective') && form.watch('budget');
  const canProceedToCreatives = canProceedToTargeting && selectedAccount && selectedPage;
  const canSubmit = canProceedToCreatives && uploadedCreatives.length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basics" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Basics
            </TabsTrigger>
            <TabsTrigger value="account" disabled={!canProceedToTargeting} className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="targeting" disabled={!selectedAccount} className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Page
            </TabsTrigger>
            <TabsTrigger value="creatives" disabled={!canProceedToCreatives} className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Creatives
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!canSubmit} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Objective</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {objectiveOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
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
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <AccountSelector
              onAccountSelected={setSelectedAccount}
              selectedAccountId={selectedAccount?.id}
            />
          </TabsContent>

          <TabsContent value="targeting" className="space-y-4">
            <PageSelector
              onPageSelected={setSelectedPage}
              selectedPageId={selectedPage?.id}
            />
          </TabsContent>

          <TabsContent value="creatives" className="space-y-4">
            <CreativeUpload
              onCreativeUploaded={handleCreativeUploaded}
              selectedPage={selectedPage}
              onCreativeRemoved={handleCreativeRemoved}
              uploadedCreatives={uploadedCreatives}
            />
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Campaign Name</Label>
                    <p className="text-sm text-muted-foreground">{form.watch('name')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Objective</Label>
                    <p className="text-sm text-muted-foreground">
                      {objectiveOptions.find(opt => opt.value === form.watch('objective'))?.label}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Budget</Label>
                    <p className="text-sm text-muted-foreground">
                      ${form.watch('budget')} ({form.watch('budgetType')})
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ad Account</Label>
                    <p className="text-sm text-muted-foreground">{selectedAccount?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Selected Page</Label>
                    <p className="text-sm text-muted-foreground">{selectedPage?.name}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Creatives ({uploadedCreatives.length})</Label>
                  <div className="mt-2 space-y-2">
                    {uploadedCreatives.map((creative) => (
                      <div key={creative.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm">{creative.name}</span>
                        <span className="text-xs text-muted-foreground">({creative.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {activeTab !== 'basics' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ['basics', 'account', 'targeting', 'creatives', 'review'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Previous
              </Button>
            )}
            
            {activeTab !== 'review' ? (
              <Button
                type="button"
                onClick={() => {
                  const tabs = ['basics', 'account', 'targeting', 'creatives', 'review'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={
                  (activeTab === 'basics' && !canProceedToTargeting) ||
                  (activeTab === 'account' && !selectedAccount) ||
                  (activeTab === 'targeting' && !canProceedToCreatives) ||
                  (activeTab === 'creatives' && !canSubmit)
                }
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading || !canSubmit}>
                {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};

export default CampaignForm;

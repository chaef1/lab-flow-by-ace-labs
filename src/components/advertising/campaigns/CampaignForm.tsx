
import React from 'react';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface CampaignFormProps {
  platform: 'tiktok' | 'meta';
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
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
        </div>
      </form>
    </Form>
  );
};

export default CampaignForm;

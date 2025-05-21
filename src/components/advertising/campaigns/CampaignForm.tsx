
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface CampaignFormProps {
  platform: 'meta';
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
  audiences?: any[];
}

// Age ranges for targeting
const ageRanges = [
  { value: '13-17', label: '13-17' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

// Gender options
const genderOptions = [
  { value: 'all', label: 'All Genders' },
  { value: '1', label: 'Men' },
  { value: '2', label: 'Women' },
];

// SA provinces for location targeting
const provinces = [
  { value: 'western_cape', label: 'Western Cape' },
  { value: 'eastern_cape', label: 'Eastern Cape' },
  { value: 'northern_cape', label: 'Northern Cape' },
  { value: 'free_state', label: 'Free State' },
  { value: 'kwazulu_natal', label: 'KwaZulu-Natal' },
  { value: 'north_west', label: 'North West' },
  { value: 'gauteng', label: 'Gauteng' },
  { value: 'mpumalanga', label: 'Mpumalanga' },
  { value: 'limpopo', label: 'Limpopo' },
];

// Interests categories for Meta targeting
const interestsCategories = [
  {
    name: 'Entertainment',
    options: [
      { id: '6003139266461', name: 'Music' },
      { id: '6003139266161', name: 'Movies' },
      { id: '6003139266261', name: 'TV Shows' },
      { id: '6003063201861', name: 'Gaming' },
    ]
  },
  {
    name: 'Shopping',
    options: [
      { id: '6003139265761', name: 'Fashion' },
      { id: '6003139269361', name: 'Beauty' },
      { id: '6003063107661', name: 'Electronics' },
      { id: '6003063108061', name: 'Home & Garden' },
    ]
  },
  {
    name: 'Lifestyle',
    options: [
      { id: '6003139268461', name: 'Fitness' },
      { id: '6003063103461', name: 'Travel' },
      { id: '6003139267661', name: 'Food & Drink' },
      { id: '6003139267261', name: 'Sports' },
    ]
  }
];

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters" }),
  objective: z.string().min(1, { message: "Please select a campaign objective" }),
  budgetType: z.string().min(1, { message: "Please select a budget type" }),
  budget: z.coerce.number().positive({ message: "Budget must be a positive number" }),
  startDate: z.string().min(1, { message: "Please select a start date" }),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  description: z.string().optional(),
  // Additional targeting options
  locations: z.array(z.string()).optional(),
  ageRanges: z.array(z.string()).optional(),
  gender: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

const CampaignForm: React.FC<CampaignFormProps> = ({
  platform,
  onSubmit,
  isLoading,
  onCancel,
  audiences = []
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      objective: '',
      budgetType: 'daily',
      budget: 500,
      startDate: '',
      endDate: '',
      targetAudience: '',
      description: '',
      locations: ['ZA'], // Default to South Africa
      ageRanges: [],
      gender: 'all',
      interests: [],
    }
  });

  const handleInterestChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInterests([...selectedInterests, id]);
      const currentInterests = form.getValues('interests') || [];
      form.setValue('interests', [...currentInterests, id]);
    } else {
      setSelectedInterests(selectedInterests.filter(item => item !== id));
      const currentInterests = form.getValues('interests') || [];
      form.setValue('interests', currentInterests.filter(item => item !== id));
    }
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Format the data for the API
    const formattedData = {
      ...data,
      targeting: {
        geo_locations: {
          countries: ['ZA'],
          regions: data.locations?.map(loc => ({ key: loc })) || []
        },
        age_min: data.ageRanges?.length ? parseInt(data.ageRanges[0].split('-')[0]) : 18,
        age_max: data.ageRanges?.length ? 
                  (data.ageRanges[data.ageRanges.length - 1].endsWith('+') ? 
                    65 : parseInt(data.ageRanges[data.ageRanges.length - 1].split('-')[1])) 
                  : 65,
        genders: data.gender === 'all' ? [1, 2] : [parseInt(data.gender)],
        interests: data.interests?.map(id => ({ id })) || []
      }
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <SelectItem value="AWARENESS">Brand Awareness</SelectItem>
                    <SelectItem value="REACH">Reach</SelectItem>
                    <SelectItem value="TRAFFIC">Traffic</SelectItem>
                    <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                    <SelectItem value="CONVERSIONS">Conversions</SelectItem>
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
              <FormLabel>Budget (ZAR)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={100} 
                  step={50} 
                  placeholder="Amount in ZAR" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Minimum budget: {formatCurrency(100)}
              </FormDescription>
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

        <Accordion type="single" collapsible className="border rounded-md">
          <AccordionItem value="targeting">
            <AccordionTrigger className="px-4">Advanced Targeting Options</AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Location Targeting */}
              <div>
                <FormLabel>Location Targeting</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {provinces.map((province) => (
                    <div key={province.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`location-${province.value}`} 
                        value={province.value}
                        onCheckedChange={(checked) => {
                          const currentLocations = form.getValues('locations') || [];
                          if (checked) {
                            form.setValue('locations', [...currentLocations, province.value]);
                          } else {
                            form.setValue('locations', currentLocations.filter(l => l !== province.value));
                          }
                        }}
                      />
                      <label htmlFor={`location-${province.value}`} className="text-sm">
                        {province.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Age Range Targeting */}
              <div>
                <FormLabel>Age Ranges</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {ageRanges.map((ageRange) => (
                    <div key={ageRange.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`age-${ageRange.value}`} 
                        value={ageRange.value}
                        onCheckedChange={(checked) => {
                          const currentAges = form.getValues('ageRanges') || [];
                          if (checked) {
                            form.setValue('ageRanges', [...currentAges, ageRange.value]);
                          } else {
                            form.setValue('ageRanges', currentAges.filter(a => a !== ageRange.value));
                          }
                        }}
                      />
                      <label htmlFor={`age-${ageRange.value}`} className="text-sm">
                        {ageRange.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Gender Targeting */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {genderOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                            <label htmlFor={`gender-${option.value}`}>{option.label}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Interests Targeting */}
              <div>
                <FormLabel>Interests</FormLabel>
                {interestsCategories.map((category) => (
                  <div key={category.name} className="mt-2">
                    <h4 className="text-sm font-medium mb-1">{category.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.options.map((interest) => (
                        <div key={interest.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`interest-${interest.id}`} 
                            checked={selectedInterests.includes(interest.id)}
                            onCheckedChange={(checked) => 
                              handleInterestChange(interest.id, checked === true)
                            }
                          />
                          <label htmlFor={`interest-${interest.id}`} className="text-sm">
                            {interest.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Custom Audiences */}
              {audiences.length > 0 && (
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Audience</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select custom audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {audiences.map((audience: any) => (
                            <SelectItem key={audience.id} value={audience.id}>
                              {audience.name} ({audience.approximate_count || 'Unknown size'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Custom audiences from your Meta account
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
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

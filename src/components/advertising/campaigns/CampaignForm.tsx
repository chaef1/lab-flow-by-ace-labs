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
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageSelector from './PageSelector';
import CreativeUpload from './CreativeUpload';

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

// Major cities for location targeting
const cities = [
  { value: 'cape_town', label: 'Cape Town', region: 'western_cape' },
  { value: 'johannesburg', label: 'Johannesburg', region: 'gauteng' },
  { value: 'pretoria', label: 'Pretoria', region: 'gauteng' },
  { value: 'durban', label: 'Durban', region: 'kwazulu_natal' },
  { value: 'port_elizabeth', label: 'Port Elizabeth', region: 'eastern_cape' },
  { value: 'bloemfontein', label: 'Bloemfontein', region: 'free_state' },
  { value: 'east_london', label: 'East London', region: 'eastern_cape' },
  { value: 'pietermaritzburg', label: 'Pietermaritzburg', region: 'kwazulu_natal' },
  { value: 'nelspruit', label: 'Nelspruit', region: 'mpumalanga' },
  { value: 'polokwane', label: 'Polokwane', region: 'limpopo' },
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
      { id: '6003139266861', name: 'Reading' },
      { id: '6003063106961', name: 'Theater' },
    ]
  },
  {
    name: 'Shopping',
    options: [
      { id: '6003139265761', name: 'Fashion' },
      { id: '6003139269361', name: 'Beauty' },
      { id: '6003063107661', name: 'Electronics' },
      { id: '6003063108061', name: 'Home & Garden' },
      { id: '6003139265361', name: 'Luxury Goods' },
      { id: '6003139269981', name: 'Health & Wellness' },
    ]
  },
  {
    name: 'Lifestyle',
    options: [
      { id: '6003139268461', name: 'Fitness' },
      { id: '6003063103461', name: 'Travel' },
      { id: '6003139267661', name: 'Food & Drink' },
      { id: '6003139267261', name: 'Sports' },
      { id: '6003139266561', name: 'Outdoor Activities' },
      { id: '6003139264961', name: 'Arts & Crafts' },
    ]
  },
  {
    name: 'Business',
    options: [
      { id: '6003139264161', name: 'Finance' },
      { id: '6003063105661', name: 'Entrepreneurship' },
      { id: '6003063105161', name: 'Marketing' },
      { id: '6003063104561', name: 'Technology' },
      { id: '6003139268561', name: 'Real Estate' },
    ]
  }
];

// Behaviors for Meta targeting
const behaviors = [
  { id: '6002714895372', name: 'Frequent Travelers' },
  { id: '6002714898572', name: 'Technology Early Adopters' },
  { id: '6003050247335', name: 'Engaged Shoppers' },
  { id: '6004854404196', name: 'Digital Activities: Online Spending' },
  { id: '6004854400996', name: 'Mobile Device Users' },
];

// Ad creative types for Meta
const creativeTypes = [
  { value: 'single_image', label: 'Single Image' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'video', label: 'Video' },
  { value: 'slideshow', label: 'Slideshow' },
  { value: 'collection', label: 'Collection' },
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
  creativeType: z.string().min(1, { message: "Please select a creative type" }).optional(),
  // Additional targeting options
  locations: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  ageRanges: z.array(z.string()).optional(),
  gender: z.string().optional(),
  interests: z.array(z.string()).optional(),
  behaviors: z.array(z.string()).optional(),
  createLookalike: z.boolean().optional(),
  lookalikeSimilarity: z.number().min(1).max(10).optional(),
});

const CampaignForm: React.FC<CampaignFormProps> = ({
  platform,
  onSubmit,
  isLoading,
  onCancel,
  audiences = []
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [targetingMethod, setTargetingMethod] = useState<string>('detailed');
  const [audienceCreationType, setAudienceCreationType] = useState<string>('none');
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [uploadedCreatives, setUploadedCreatives] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('campaign');

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
      creativeType: 'single_image',
      locations: ['ZA'], // Default to South Africa
      cities: [],
      ageRanges: [],
      gender: 'all',
      interests: [],
      behaviors: [],
      createLookalike: false,
      lookalikeSimilarity: 5
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

  const handleBehaviorChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBehaviors([...selectedBehaviors, id]);
      const currentBehaviors = form.getValues('behaviors') || [];
      form.setValue('behaviors', [...currentBehaviors, id]);
    } else {
      setSelectedBehaviors(selectedBehaviors.filter(item => item !== id));
      const currentBehaviors = form.getValues('behaviors') || [];
      form.setValue('behaviors', currentBehaviors.filter(item => item !== id));
    }
  };

  const handlePageSelected = (page: any) => {
    console.log('Page selected:', page);
    setSelectedPage(page);
  };

  const handleCreativeUploaded = (creative: any) => {
    console.log('Creative uploaded:', creative);
    setUploadedCreatives(prev => [...prev, creative]);
  };

  const handleCreativeRemoved = (creativeId: string) => {
    setUploadedCreatives(prev => prev.filter(c => c.id !== creativeId));
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Validate required elements
    if (!selectedPage) {
      form.setError('root', { message: 'Please select a Facebook page or Instagram account' });
      return;
    }

    if (uploadedCreatives.length === 0) {
      form.setError('root', { message: 'Please upload at least one creative asset' });
      return;
    }

    // Format the data for the API
    const formattedData = {
      ...data,
      selectedPage,
      creatives: uploadedCreatives,
      targeting: {
        geo_locations: {
          countries: ['ZA'],
          regions: data.locations?.map(loc => ({ key: loc })) || [],
          cities: data.cities?.map(city => ({ key: city })) || []
        },
        age_min: data.ageRanges?.length ? parseInt(data.ageRanges[0].split('-')[0]) : 18,
        age_max: data.ageRanges?.length ? 
                  (data.ageRanges[data.ageRanges.length - 1].endsWith('+') ? 
                    65 : parseInt(data.ageRanges[data.ageRanges.length - 1].split('-')[1])) 
                  : 65,
        genders: data.gender === 'all' ? [1, 2] : [parseInt(data.gender)],
        interests: data.interests?.map(id => ({ id })) || [],
        behaviors: data.behaviors?.map(id => ({ id })) || []
      },
      lookalikeAudience: data.createLookalike ? {
        origin: data.targetAudience,
        similarity: data.lookalikeSimilarity
      } : undefined
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="page">Page/Account</TabsTrigger>
            <TabsTrigger value="creatives">Creatives</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Campaign Settings</h3>
              
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
            </div>
            
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
                        <SelectItem value="OUTCOME_AWARENESS">Brand Awareness</SelectItem>
                        <SelectItem value="REACH">Reach</SelectItem>
                        <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                        <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                        <SelectItem value="VIDEO_VIEWS">Video Views</SelectItem>
                        <SelectItem value="OUTCOME_LEADS">Lead Generation</SelectItem>
                        <SelectItem value="OUTCOME_SALES">Conversions</SelectItem>
                        <SelectItem value="STORE_VISITS">Store Traffic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="creativeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creative Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select creative type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_image">Single Image</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="slideshow">Slideshow</SelectItem>
                        <SelectItem value="collection">Collection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Budget and dates section */}
            <div className="grid gap-4 md:grid-cols-3">
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
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (ZAR)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</div>
                        <Input 
                          type="number" 
                          min={50} 
                          step={10} 
                          className="pl-8"
                          placeholder="Amount" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Minimum budget: R50
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Estimated Daily Reach</FormLabel>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted/50">
                  {form.watch('budget') > 0 ? `~${Math.floor(form.watch('budget') * 100)} - ${Math.floor(form.watch('budget') * 300)} people` : '0 people'}
                </div>
                <FormDescription>
                  Based on your targeting & budget
                </FormDescription>
              </div>
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
                    <FormLabel>End Date (Optional)</FormLabel>
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
          </TabsContent>

          <TabsContent value="page" className="space-y-4 pt-4">
            <PageSelector
              onPageSelected={handlePageSelected}
              selectedPageId={selectedPage?.id}
            />
          </TabsContent>

          <TabsContent value="creatives" className="space-y-4 pt-4">
            <CreativeUpload
              onCreativeUploaded={handleCreativeUploaded}
              selectedPage={selectedPage}
              onCreativeRemoved={handleCreativeRemoved}
              uploadedCreatives={uploadedCreatives}
            />
          </TabsContent>

          <TabsContent value="targeting" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Audience & Targeting</h3>
              
              <Tabs 
                defaultValue={targetingMethod} 
                onValueChange={setTargetingMethod}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="detailed">Detailed Targeting</TabsTrigger>
                  <TabsTrigger value="custom">Custom Audiences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="detailed" className="space-y-4 pt-4">
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="locations">
                      <AccordionTrigger>Location Targeting</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div>
                            <FormLabel className="mb-2 block">Regions</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                          
                          <div>
                            <FormLabel className="mb-2 block">Cities</FormLabel>
                            <ScrollArea className="h-40 border rounded-md p-2">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {cities.map((city) => (
                                  <div key={city.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`city-${city.value}`} 
                                      value={city.value}
                                      onCheckedChange={(checked) => {
                                        const currentCities = form.getValues('cities') || [];
                                        if (checked) {
                                          form.setValue('cities', [...currentCities, city.value]);
                                        } else {
                                          form.setValue('cities', currentCities.filter(c => c !== city.value));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`city-${city.value}`} className="text-sm">
                                      {city.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="demographics">
                      <AccordionTrigger>Demographics</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-6">
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
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="all" id="gender-all" />
                                      <label htmlFor="gender-all">All Genders</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="1" id="gender-1" />
                                      <label htmlFor="gender-1">Men</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="2" id="gender-2" />
                                      <label htmlFor="gender-2">Women</label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="interests">
                      <AccordionTrigger>Interests</AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-60">
                          {interestsCategories.map((category) => (
                            <div key={category.name} className="mb-4">
                              <h4 className="text-sm font-medium mb-2">{category.name}</h4>
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
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="behaviors">
                      <AccordionTrigger>Behaviors</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2">
                          {behaviors.map((behavior) => (
                            <div key={behavior.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`behavior-${behavior.id}`} 
                                checked={selectedBehaviors.includes(behavior.id)}
                                onCheckedChange={(checked) => 
                                  handleBehaviorChange(behavior.id, checked === true)
                                }
                              />
                              <label htmlFor={`behavior-${behavior.id}`} className="text-sm">
                                {behavior.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Custom Audience</FormLabel>
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
                              {audiences?.map((audience: any) => (
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
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        {form.formState.errors.root && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{form.formState.errors.root.message}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-2 pt-4">
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

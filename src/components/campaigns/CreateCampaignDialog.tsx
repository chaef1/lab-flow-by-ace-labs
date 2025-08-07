import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, DollarSign, Target, Users, X } from 'lucide-react';
import { format } from 'date-fns';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    campaignType: 'influencer',
    budget: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    targetInfluencers: '',
    platforms: [] as string[],
    objectives: [] as string[],
    kpis: [] as string[]
  });

  const [newObjective, setNewObjective] = useState('');
  const [newKpi, setNewKpi] = useState('');

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn'];
  const commonObjectives = [
    'Brand Awareness', 'Lead Generation', 'Sales', 'Engagement', 'Website Traffic', 'App Downloads'
  ];
  const commonKpis = [
    'Reach', 'Impressions', 'Engagement Rate', 'Click-through Rate', 'Conversions', 'Cost per Acquisition'
  ];

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const addObjective = (objective: string) => {
    if (objective && !formData.objectives.includes(objective)) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, objective]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (objective: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter(o => o !== objective)
    }));
  };

  const addKpi = (kpi: string) => {
    if (kpi && !formData.kpis.includes(kpi)) {
      setFormData(prev => ({
        ...prev,
        kpis: [...prev.kpis, kpi]
      }));
      setNewKpi('');
    }
  };

  const removeKpi = (kpi: string) => {
    setFormData(prev => ({
      ...prev,
      kpis: prev.kpis.filter(k => k !== kpi)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle campaign creation
    console.log('Creating campaign:', formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up your new influencer marketing campaign with all the essential details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Summer Fashion Campaign"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="Brand Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select value={formData.campaignType} onValueChange={(value) => setFormData(prev => ({ ...prev, campaignType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="influencer">Influencer Marketing</SelectItem>
                    <SelectItem value="ugc">User Generated Content</SelectItem>
                    <SelectItem value="ambassador">Brand Ambassador</SelectItem>
                    <SelectItem value="product-launch">Product Launch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your campaign goals and requirements..."
                  rows={3}
                />
              </div>
            </Card>

            {/* Budget & Timeline */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Budget & Timeline</h3>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="50000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetInfluencers">Target Number of Creators</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="targetInfluencers"
                    type="number"
                    value={formData.targetInfluencers}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetInfluencers: e.target.value }))}
                    placeholder="15"
                    className="pl-10"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Platforms */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Target Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map(platform => (
                <Button
                  key={platform}
                  type="button"
                  variant={formData.platforms.includes(platform) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlatformToggle(platform)}
                >
                  {platform}
                </Button>
              ))}
            </div>
          </Card>

          {/* Objectives */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Campaign Objectives</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add custom objective..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective(newObjective))}
                />
                <Button type="button" onClick={() => addObjective(newObjective)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {commonObjectives.map(objective => (
                  <Button
                    key={objective}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addObjective(objective)}
                    disabled={formData.objectives.includes(objective)}
                  >
                    {objective}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.objectives.map(objective => (
                  <Badge key={objective} variant="default" className="flex items-center gap-1">
                    {objective}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeObjective(objective)} />
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* KPIs */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Key Performance Indicators</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newKpi}
                  onChange={(e) => setNewKpi(e.target.value)}
                  placeholder="Add custom KPI..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKpi(newKpi))}
                />
                <Button type="button" onClick={() => addKpi(newKpi)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {commonKpis.map(kpi => (
                  <Button
                    key={kpi}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addKpi(kpi)}
                    disabled={formData.kpis.includes(kpi)}
                  >
                    {kpi}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.kpis.map(kpi => (
                  <Badge key={kpi} variant="secondary" className="flex items-center gap-1">
                    {kpi}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeKpi(kpi)} />
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
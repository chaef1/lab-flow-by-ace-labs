import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, X } from 'lucide-react';
import { Platform } from '@/hooks/useModashDiscovery';

interface FilterRailProps {
  platform: Platform;
  filters: any;
  onFiltersChange: (filters: any) => void;
  displaySettings: any;
  onDisplaySettingsChange: (settings: any) => void;
}

export const ModernFilterRail: React.FC<FilterRailProps> = ({
  platform,
  filters,
  onFiltersChange,
  displaySettings,
  onDisplaySettingsChange,
}) => {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'followers' && key !== 'engagementRate' && filters[key]
  );

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || key === 'followers' || key === 'engagementRate') return null;
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                  >
                    {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => clearFilter(key)}
                    />
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Display</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailOnly"
              checked={displaySettings.showEmailOnly}
              onCheckedChange={(checked) => 
                onDisplaySettingsChange({ 
                  ...displaySettings, 
                  showEmailOnly: checked 
                })
              }
            />
            <Label htmlFor="emailOnly" className="text-xs">Email available</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hideWatchlisted"
              checked={displaySettings.hideWatchlisted}
              onCheckedChange={(checked) => 
                onDisplaySettingsChange({ 
                  ...displaySettings, 
                  hideWatchlisted: checked 
                })
              }
            />
            <Label htmlFor="hideWatchlisted" className="text-xs">Hide saved profiles</Label>
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Demographics</CardTitle>
                <ChevronDown className="w-4 h-4" />
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Location</Label>
                <Select
                  value={filters.location?.[0]?.id || ''}
                  onValueChange={(value) => 
                    updateFilter('location', value ? [{ id: value }] : undefined)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="ZA">South Africa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Language</Label>
                <Select
                  value={filters.language?.[0] || ''}
                  onValueChange={(value) => 
                    updateFilter('language', value ? [value] : undefined)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Any language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Performance */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <ChevronDown className="w-4 h-4" />
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs text-muted-foreground">Followers</Label>
                  <span className="text-xs text-muted-foreground">
                    {filters.followers?.min?.toLocaleString() || '0'} - {filters.followers?.max?.toLocaleString() || '∞'}
                  </span>
                </div>
                <Slider
                  value={[
                    Math.log10(filters.followers?.min || 1000),
                    Math.log10(filters.followers?.max || 10000000)
                  ]}
                  onValueChange={([min, max]) => {
                    updateFilter('followers', {
                      min: Math.round(Math.pow(10, min)),
                      max: Math.round(Math.pow(10, max))
                    });
                  }}
                  min={3}
                  max={7}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs text-muted-foreground">Engagement Rate</Label>
                  <span className="text-xs text-muted-foreground">
                    {((filters.engagementRate?.min || 0) * 100).toFixed(1)}% - {((filters.engagementRate?.max || 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[
                    (filters.engagementRate?.min || 0) * 100,
                    (filters.engagementRate?.max || 0.5) * 100
                  ]}
                  onValueChange={([min, max]) => {
                    updateFilter('engagementRate', {
                      min: min / 100,
                      max: max / 100
                    });
                  }}
                  min={0}
                  max={50}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
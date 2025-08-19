import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useModashDiscovery } from '@/hooks/useModashDiscovery';
import { SearchFilters } from '@/hooks/useModashSearch';

interface AdvancedFiltersProps {
  platform: string;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  platform,
  filters,
  onFiltersChange,
  onClose
}) => {
  const { useDictionary } = useModashDiscovery();
  
  const [followerRange, setFollowerRange] = useState([
    filters.influencer?.followers?.min || 1000,
    filters.influencer?.followers?.max || 10000000
  ]);
  
  const [engagementRange, setEngagementRange] = useState([
    (filters.influencer?.engagementRate?.min || 0) * 100,
    (filters.influencer?.engagementRate?.max || 0.2) * 100
  ]);

  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    filters.influencer?.location?.countries || []
  );
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    filters.influencer?.interests || []
  );
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    filters.influencer?.language || []
  );

  const [locationQuery, setLocationQuery] = useState('');
  const [interestQuery, setInterestQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');

  // Fetch dictionaries
  const locationsQuery = useDictionary('location');
  const interestsQuery = useDictionary('interest');
  const languagesQuery = useDictionary('language');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleApplyFilters = () => {
    const newFilters: SearchFilters = {
      influencer: {
        ...filters.influencer,
        followers: { min: followerRange[0], max: followerRange[1] },
        engagementRate: { min: engagementRange[0] / 100, max: engagementRange[1] / 100 },
        ...(selectedCountries.length > 0 && {
          location: { countries: selectedCountries }
        }),
        ...(selectedInterests.length > 0 && {
          interests: selectedInterests
        }),
        ...(selectedLanguages.length > 0 && {
          language: selectedLanguages
        })
      }
    };
    
    onFiltersChange(newFilters);
    onClose();
  };

  const handleReset = () => {
    setFollowerRange([1000, 10000000]);
    setEngagementRange([0, 20]);
    setSelectedCountries([]);
    setSelectedInterests([]);
    setSelectedLanguages([]);
    
    onFiltersChange({
      influencer: {
        followers: { min: 1000, max: 10000000 },
        engagementRate: { min: 0, max: 0.2 }
      }
    });
  };

  const removeCountry = (country: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== country));
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const removeLanguage = (language: string) => {
    setSelectedLanguages(prev => prev.filter(l => l !== language));
  };

  return (
    <div className="space-y-6">
      {/* Audience Size */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Follower Count</Label>
        <Slider
          value={followerRange}
          onValueChange={setFollowerRange}
          max={10000000}
          min={1000}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatNumber(followerRange[0])}</span>
          <span>{formatNumber(followerRange[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Engagement Rate */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Engagement Rate (%)</Label>
        <Slider
          value={engagementRange}
          onValueChange={setEngagementRange}
          max={20}
          min={0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{engagementRange[0]}%</span>
          <span>{engagementRange[1]}%</span>
        </div>
      </div>

      <Separator />

      {/* Location Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Audience Location</Label>
        <Input
          placeholder="Search countries..."
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
        />
        
        {selectedCountries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCountries.map(country => (
              <Badge key={country} variant="secondary" className="flex items-center gap-1">
                {country}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeCountry(country)}
                />
              </Badge>
            ))}
          </div>
        )}

        {locationQuery.length >= 2 && locationsQuery.data && (
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {locationsQuery.data
              .filter(location => 
                location.name.toLowerCase().includes(locationQuery.toLowerCase()) &&
                !selectedCountries.includes(location.name)
              )
              .slice(0, 10)
              .map(location => (
                <div
                  key={location.id}
                  className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedCountries(prev => [...prev, location.name]);
                    setLocationQuery('');
                  }}
                >
                  {location.name}
                </div>
              ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Interests */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Content Interests</Label>
        <Input
          placeholder="Search interests..."
          value={interestQuery}
          onChange={(e) => setInterestQuery(e.target.value)}
        />
        
        {selectedInterests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map(interest => (
              <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                {interest}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeInterest(interest)}
                />
              </Badge>
            ))}
          </div>
        )}

        {interestQuery.length >= 2 && interestsQuery.data && (
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {interestsQuery.data
              .filter(interest => 
                interest.name.toLowerCase().includes(interestQuery.toLowerCase()) &&
                !selectedInterests.includes(interest.name)
              )
              .slice(0, 10)
              .map(interest => (
                <div
                  key={interest.id}
                  className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedInterests(prev => [...prev, interest.name]);
                    setInterestQuery('');
                  }}
                >
                  {interest.name}
                </div>
              ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Languages */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Audience Language</Label>
        <Input
          placeholder="Search languages..."
          value={languageQuery}
          onChange={(e) => setLanguageQuery(e.target.value)}
        />
        
        {selectedLanguages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map(language => (
              <Badge key={language} variant="secondary" className="flex items-center gap-1">
                {language}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeLanguage(language)}
                />
              </Badge>
            ))}
          </div>
        )}

        {languageQuery.length >= 2 && languagesQuery.data && (
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {languagesQuery.data
              .filter(language => 
                language.name.toLowerCase().includes(languageQuery.toLowerCase()) &&
                !selectedLanguages.includes(language.name)
              )
              .slice(0, 10)
              .map(language => (
                <div
                  key={language.id}
                  className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedLanguages(prev => [...prev, language.name]);
                    setLanguageQuery('');
                  }}
                >
                  {language.name}
                </div>
              ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Additional Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Additional Options</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="verified"
              checked={filters.influencer?.isVerified || false}
              onCheckedChange={(checked) => 
                onFiltersChange({
                  ...filters,
                  influencer: { ...filters.influencer, isVerified: !!checked }
                })
              }
            />
            <Label htmlFor="verified" className="text-sm">Verified accounts only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="contact"
              checked={filters.influencer?.hasContactDetails || false}
              onCheckedChange={(checked) => 
                onFiltersChange({
                  ...filters,
                  influencer: { ...filters.influencer, hasContactDetails: !!checked }
                })
              }
            />
            <Label htmlFor="contact" className="text-sm">Has contact details</Label>
          </div>
        </div>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Audience Gender</Label>
        <Select
          value={filters.influencer?.gender?.[0] || ''}
          onValueChange={(value) => 
            onFiltersChange({
              ...filters,
              influencer: { 
                ...filters.influencer, 
                gender: value ? [value] : undefined 
              }
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex-1"
        >
          Reset Filters
        </Button>
        <Button onClick={handleApplyFilters} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  );
};
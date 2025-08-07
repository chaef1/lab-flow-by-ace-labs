import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, MapPin, Users, Target, Calendar } from 'lucide-react';
import { InfluencerCard } from '@/components/influencers/InfluencerCard';
import { EnhancedInfluencerSearch } from './EnhancedInfluencerSearch';
import { useInfluencerAssignments } from '@/hooks/useInfluencerAssignments';

export function InfluencerDiscovery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [followerRange, setFollowerRange] = useState([1000, 1000000]);
  const [engagementRange, setEngagementRange] = useState([1, 20]);
  const [ageRange, setAgeRange] = useState('all');

  const { influencers, isLoading } = useInfluencerAssignments();

  // Extract unique values for filters
  const categories = Array.from(new Set(influencers.flatMap(inf => inf.categories || [])));
  const platforms = Array.from(new Set(influencers.map(inf => inf.platform)));
  const countries = Array.from(new Set(influencers.map(inf => inf.location_country).filter(Boolean)));

  // Advanced filtering logic
  const filteredInfluencers = influencers.filter(inf => {
    // Text search
    const searchMatch = !searchTerm || 
      (inf.full_name && inf.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.username && inf.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.bio && inf.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inf.content_themes && inf.content_themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase())));

    // Category filter
    const categoryMatch = selectedCategory === 'all' || 
      (inf.categories && inf.categories.includes(selectedCategory));

    // Platform filter
    const platformMatch = selectedPlatform === 'all' || inf.platform === selectedPlatform;

    // Gender filter
    const genderMatch = selectedGender === 'all' || inf.gender === selectedGender;

    // Country filter
    const countryMatch = selectedCountry === 'all' || inf.location_country === selectedCountry;

    // Follower range filter
    const followerMatch = inf.follower_count && 
      inf.follower_count >= followerRange[0] && 
      inf.follower_count <= followerRange[1];

    // Engagement range filter
    const engagementMatch = inf.engagement_rate && 
      inf.engagement_rate >= engagementRange[0] && 
      inf.engagement_rate <= engagementRange[1];

    // Age range filter
    const ageMatch = ageRange === 'all' || inf.age_range === ageRange;

    return searchMatch && categoryMatch && platformMatch && genderMatch && 
           countryMatch && followerMatch && engagementMatch && ageMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Multi-Platform Search - Primary Feature */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Creator Discovery</h2>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live Ayrshare Integration
          </Badge>
        </div>
        <EnhancedInfluencerSearch />
      </div>
      
      {/* Database Search & Filtering */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Search Saved Creators</h3>
        <Card className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, bio, content themes, or keywords..."
              className="pl-10 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Followers: {followerRange[0].toLocaleString()} - {followerRange[1].toLocaleString()}
              </label>
              <Slider
                value={followerRange}
                onValueChange={setFollowerRange}
                min={1000}
                max={10000000}
                step={10000}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Target className="mr-2 h-4 w-4" />
                Engagement: {engagementRange[0]}% - {engagementRange[1]}%
              </label>
              <Slider
                value={engagementRange}
                onValueChange={setEngagementRange}
                min={0.1}
                max={25}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {filteredInfluencers.length} creators found
              </Badge>
              {searchTerm && (
                <Badge variant="secondary">
                  "{searchTerm}"
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Save Search
              </Button>
              <Button size="sm">
                Export Results
              </Button>
            </div>
          </div>
        </div>
        </Card>

        {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInfluencers.map((influencer) => (
          <InfluencerCard
            key={influencer.id}
            influencer={influencer}
            campaigns={influencer.campaigns}
            pools={influencer.pools}
            onViewProfile={() => {}}
            onAddToPool={() => {}}
            onAddToCampaign={() => {}}
          />
        ))}
      </div>

      {filteredInfluencers.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No creators found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}
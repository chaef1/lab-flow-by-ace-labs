import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Users, Target, TrendingUp, Sparkles } from 'lucide-react';

export function LookalikeEngine() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [lookalikeResults, setLookalikeResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample creator for demo
  const sampleCreators = [
    {
      id: '1',
      name: 'Emma Johnson',
      username: '@emmastyle',
      platform: 'instagram',
      followerCount: 125000,
      engagementRate: 3.8,
      categories: ['Fashion', 'Lifestyle'],
      profileImage: null
    },
    {
      id: '2',
      name: 'Alex Chen',
      username: '@alexfitness',
      platform: 'tiktok',
      followerCount: 89000,
      engagementRate: 4.2,
      categories: ['Fitness', 'Health'],
      profileImage: null
    }
  ];

  const handleGenerateLookalikes = async (creator: any) => {
    setSelectedCreator(creator);
    setIsGenerating(true);
    
    // Simulate lookalike generation
    setTimeout(() => {
      setLookalikeResults([
        {
          id: '3',
          name: 'Sofia Martinez',
          username: '@sofia_chic',
          similarity: 94,
          reason: 'Similar fashion aesthetic and audience demographics',
          followerCount: 98000,
          engagementRate: 4.1,
          platform: 'instagram',
          categories: ['Fashion', 'Beauty'],
          commonAttributes: ['Fashion focus', 'Female 18-34 audience', 'High engagement']
        },
        {
          id: '4',
          name: 'Maya Patel',
          username: '@maya_trends',
          similarity: 89,
          reason: 'Comparable content style and posting frequency',
          followerCount: 156000,
          engagementRate: 3.2,
          platform: 'instagram',
          categories: ['Fashion', 'Lifestyle'],
          commonAttributes: ['Similar posting schedule', 'Fashion content', 'Brand partnerships']
        },
        {
          id: '5',
          name: 'Isabella Rose',
          username: '@bella_lifestyle',
          similarity: 85,
          reason: 'Overlapping audience and content themes',
          followerCount: 87000,
          engagementRate: 4.5,
          platform: 'instagram',
          categories: ['Lifestyle', 'Fashion'],
          commonAttributes: ['Lifestyle content', 'High female audience', 'Premium brands']
        }
      ]);
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Search for Base Creator */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              AI Lookalike Engine
            </h3>
            <p className="text-muted-foreground">
              Find creators similar to your top performers or discover new talent with similar characteristics
            </p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a creator to find lookalikes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sample creators for demo */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Your Top Performers</h4>
            <div className="grid gap-3">
              {sampleCreators.map((creator) => (
                <Card key={creator.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={creator.profileImage || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h5 className="font-medium">{creator.name}</h5>
                        <p className="text-sm text-muted-foreground">{creator.username}</p>
                      </div>
                      <div className="flex space-x-1">
                        {creator.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <div>{creator.followerCount.toLocaleString()} followers</div>
                        <div className="text-muted-foreground">{creator.engagementRate}% engagement</div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleGenerateLookalikes(creator)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? 'Generating...' : 'Find Lookalikes'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Lookalike Results */}
      {selectedCreator && lookalikeResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Creators Similar to {selectedCreator.name}
            </h3>
            <Button variant="outline" size="sm">
              Save Lookalike Set
            </Button>
          </div>

          <div className="grid gap-4">
            {lookalikeResults.map((creator, index) => (
              <Card key={creator.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex flex-col items-center space-y-1">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={creator.profileImage || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {creator.similarity}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Similar
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="font-semibold text-lg">{creator.name}</h4>
                        <p className="text-muted-foreground">{creator.username}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{creator.platform}</Badge>
                          {creator.categories.map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Users size={14} className="mr-1" />
                          {creator.followerCount.toLocaleString()} followers
                        </span>
                        <span className="flex items-center">
                          <Target size={14} className="mr-1" />
                          {creator.engagementRate}% engagement
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Why similar:</span> {creator.reason}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {creator.commonAttributes.map((attr: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button size="sm">
                      Add to Campaign
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* How it Works */}
      {!selectedCreator && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">How Lookalike Engine Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Audience Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Analyze demographics, interests, and engagement patterns
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Content Matching</h4>
              <p className="text-sm text-muted-foreground">
                Compare content themes, posting frequency, and visual style
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Performance Metrics</h4>
              <p className="text-sm text-muted-foreground">
                Match engagement rates, growth patterns, and reach
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">AI Scoring</h4>
              <p className="text-sm text-muted-foreground">
                Generate similarity scores and recommendations
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
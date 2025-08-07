import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link2, Search, Target, TrendingUp, Users } from 'lucide-react';

export function ProductMatcher() {
  const [productUrl, setProductUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResults, setMatchResults] = useState<any[]>([]);

  const handleAnalyzeProduct = async () => {
    setIsAnalyzing(true);
    
    // Simulate product analysis
    setTimeout(() => {
      setMatchResults([
        {
          id: '1',
          name: 'Sarah Fashion',
          score: 95,
          reason: 'Perfect brand alignment with fashion content',
          followerCount: 85000,
          engagementRate: 3.2,
          relevantPosts: 12,
          averageViews: 15000,
          platform: 'instagram'
        },
        {
          id: '2', 
          name: 'Style Maven',
          score: 88,
          reason: 'Similar aesthetic and target audience',
          followerCount: 125000,
          engagementRate: 2.8,
          relevantPosts: 8,
          averageViews: 22000,
          platform: 'tiktok'
        },
        {
          id: '3',
          name: 'Fashion Forward',
          score: 82,
          reason: 'High engagement with similar products',
          followerCount: 67000,
          engagementRate: 4.1,
          relevantPosts: 15,
          averageViews: 11000,
          platform: 'instagram'
        }
      ]);
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Product URL Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Product URL Matcher</h3>
            <p className="text-muted-foreground">
              Paste a product URL to find creators who have featured similar products or would be a perfect fit
            </p>
          </div>
          
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com/product-page"
                className="pl-10"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAnalyzeProduct}
              disabled={!productUrl || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Find Matches'}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Analyzing product and finding matching creators...
              </div>
              <Progress value={66} className="h-2" />
            </div>
          )}
        </div>
      </Card>

      {/* Match Results */}
      {matchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Top Creator Matches ({matchResults.length})
            </h3>
            <Button variant="outline" size="sm">
              Export Matches
            </Button>
          </div>

          <div className="grid gap-4">
            {matchResults.map((match, index) => (
              <Card key={match.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-semibold">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{match.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {match.platform}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {match.followerCount.toLocaleString()} followers
                      </span>
                      <span className="flex items-center">
                        <Target size={14} className="mr-1" />
                        {match.engagementRate}% engagement
                      </span>
                      <span className="flex items-center">
                        <TrendingUp size={14} className="mr-1" />
                        {match.averageViews.toLocaleString()} avg views
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Match Reason:</span> {match.reason}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {match.relevantPosts} posts with similar products
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {match.score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Match Score
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button size="sm">
                        Add to Campaign
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* How it Works */}
      {matchResults.length === 0 && !isAnalyzing && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">How Product Matching Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">1. Product Analysis</h4>
              <p className="text-sm text-muted-foreground">
                We analyze the product page, extracting key details like category, price, style, and target audience
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">2. Creator Matching</h4>
              <p className="text-sm text-muted-foreground">
                Our AI compares the product with creator content, audience demographics, and past collaborations
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">3. Scored Results</h4>
              <p className="text-sm text-muted-foreground">
                Get ranked results with match scores, reasons, and performance predictions
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
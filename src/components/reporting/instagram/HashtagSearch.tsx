import { useState } from 'react';
import { Search, Hash, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const HashtagSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a hashtag",
        description: "Enter a hashtag to search for related content and analytics.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults([]);
    
    try {
      // Call Meta API for hashtag search
      const response = await fetch('/api/meta/hashtag-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtag: searchTerm }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to search hashtag: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults([data]);
      
      toast({
        title: "Hashtag analysis complete",
        description: `Found analytics for #${searchTerm}`,
      });
    } catch (error: any) {
      console.error('Hashtag search error:', error);
      toast({
        title: "API Error - Hashtag Search Failed",
        description: error.message || "Unable to fetch hashtag data. Please check your Meta API connection and permissions.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Hashtag Research & Analytics
          </CardTitle>
          <CardDescription>
            Search for hashtags to analyze their performance, reach, and competition level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter hashtag (without #)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{results[0].postCount.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                  <p className="text-2xl font-bold">{results[0].engagement}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Posts</p>
                  <p className="text-2xl font-bold">{results[0].topPosts}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                  <Badge variant={results[0].difficulty === 'easy' ? 'default' : results[0].difficulty === 'medium' ? 'secondary' : 'destructive'}>
                    {results[0].difficulty}
                  </Badge>
                </div>
                <Hash className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hashtag Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hashtag</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Engagement Rate</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{result.hashtag}</TableCell>
                    <TableCell>{result.postCount.toLocaleString()}</TableCell>
                    <TableCell>{result.engagement}%</TableCell>
                    <TableCell>
                      <Badge variant={result.difficulty === 'easy' ? 'default' : result.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                        {result.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TrendingUp className={`h-4 w-4 ${result.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HashtagSearch;
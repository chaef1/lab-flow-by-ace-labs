import { useState } from 'react';
import { Search, Hash, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const HashtagSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
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
    setResults(null);
    
    try {
      // Get user's profile key
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.ayrshare_profile_key) {
        throw new Error('No Ayrshare account connected. Please connect your social media accounts first.');
      }

      // Call Ayrshare API for hashtag search
      const { data, error } = await supabase.functions.invoke('ayrshare-analytics', {
        body: { 
          action: 'hashtag_search',
          username: searchTerm, // Using username field for hashtag
          platform: 'instagram',
          profileKey: profile.ayrshare_profile_key
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to search hashtag with Ayrshare');
      }

      if (!data.success) {
        throw new Error(data.error || 'Ayrshare API returned an error');
      }

      setResults(data.data);
      
      toast({
        title: "Hashtag analysis complete",
        description: `Found analytics for #${searchTerm}`,
      });
    } catch (error: any) {
      console.error('Hashtag search error:', error);
      toast({
        title: "API Error - Hashtag Search Failed",
        description: error.message || "Unable to fetch hashtag data from Ayrshare. Please check your Ayrshare API connection.",
        variant: "destructive"
      });
      setResults(null);
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

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{results.totalPosts.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{results.avgEngagement}%</p>
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
                  <p className="text-2xl font-bold">{results.topPosts?.length || 0}</p>
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
                  <Badge variant={results.difficulty === 'Low' || results.difficulty === 'Very Low' ? 'default' : 'destructive'}>
                    {results.difficulty}
                  </Badge>
                </div>
                <Hash className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {results && (
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
                  <TableHead>Top Posts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">#{results.hashtag || searchTerm}</TableCell>
                  <TableCell>{results.totalPosts.toLocaleString()}</TableCell>
                  <TableCell>{results.avgEngagement}%</TableCell>
                  <TableCell>
                    <Badge variant={results.difficulty === 'Low' || results.difficulty === 'Very Low' ? 'default' : 'destructive'}>
                      {results.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{results.topPosts?.length || 0}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HashtagSearch;
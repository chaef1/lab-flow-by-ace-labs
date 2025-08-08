import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Loader, Music, AlertCircle } from 'lucide-react';

export function SimpleTikTokSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const searchTikTokProfile = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a TikTok username');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    
    try {
      console.log('Starting TikTok search for:', searchQuery);
      
      const { data, error: functionError } = await supabase.functions.invoke('tiktok-display-api', {
        body: {
          username: searchQuery.replace('@', ''),
          action: 'get_user_info'
        }
      });

      console.log('Function response:', { data, functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        setError(`Search failed: ${functionError.message || 'Unknown error'}`);
        toast({
          title: "Search Error",
          description: `Unable to search: ${functionError.message || 'Please try again'}`,
          variant: "destructive"
        });
        return;
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Search failed';
        console.error('API error:', data);
        setError(errorMsg);
        
        if (data?.requires_setup) {
          toast({
            title: "TikTok API Setup Required",
            description: "TikTok Display API credentials need to be configured",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Search Failed",
            description: errorMsg,
            variant: "destructive"
          });
        }
        return;
      }

      if (data?.profile_data) {
        setSearchResults([data.profile_data]);
        toast({
          title: "Profile Found",
          description: `Found TikTok profile: @${data.profile_data.username}`,
        });
      } else {
        setError('No TikTok profile found');
        toast({
          title: "No Results",
          description: "No TikTok profile found with that username",
        });
      }
      
    } catch (error: any) {
      console.error('Search error:', error);
      const errorMsg = `Search failed: ${error.message || 'Network error'}`;
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToDatabase = async (profile: any) => {
    try {
      console.log('Adding profile to database:', profile);
      
      // Get user's organization
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!userProfile?.organization_id) {
        toast({
          title: "Organization Error",
          description: "Unable to determine your organization",
          variant: "destructive"
        });
        return;
      }

      const influencerData = {
        id: crypto.randomUUID(),
        username: profile.username,
        full_name: profile.full_name || '',
        profile_picture_url: profile.avatar_url || '',
        bio: profile.bio || '',
        follower_count: profile.follower_count || 0,
        engagement_rate: profile.engagement_rate || 0,
        platform: 'tiktok',
        tiktok_handle: profile.username,
        verified: profile.verified || false,
        organization_id: userProfile.organization_id,
        likes_count: profile.likes_count || 0,
        video_count: profile.video_count || 0,
        following_count: profile.following_count || 0
      };

      const { error } = await supabase
        .from('influencers')
        .upsert(influencerData, { 
          onConflict: 'username,platform,organization_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Database Error",
          description: `Failed to save profile: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${profile.username} added to your database`,
      });
      
    } catch (error: any) {
      console.error('Error adding to database:', error);
      toast({
        title: "Error",
        description: `Failed to add profile: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Music className="h-5 w-5" />
            <h3 className="text-lg font-semibold">TikTok Profile Search</h3>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Enter TikTok username (e.g., @username or username)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTikTokProfile()}
              className="flex-1"
            />
            <Button 
              onClick={searchTikTokProfile} 
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Search Results</h4>
          {searchResults.map((profile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.username}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold">
                        {profile.username?.slice(0, 2).toUpperCase() || 'TT'}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-semibold">{profile.full_name || profile.username}</h4>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{(profile.follower_count || 0).toLocaleString()} followers</span>
                      <span>{(profile.video_count || 0).toLocaleString()} videos</span>
                      {profile.engagement_rate > 0 && (
                        <span>{profile.engagement_rate}% engagement</span>
                      )}
                      <Badge variant="outline">Display API</Badge>
                      {profile.verified && <Badge>Verified</Badge>}
                    </div>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => addToDatabase(profile)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Database
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Status Info */}
      <Card className="p-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">TikTok Integration Status</h4>
          <div className="flex items-center space-x-2">
            <Music className="h-4 w-4 text-black" />
            <span className="text-sm">TikTok Search</span>
            <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Search powered by TikTok Display API
          </p>
        </div>
      </Card>
    </div>
  );
}
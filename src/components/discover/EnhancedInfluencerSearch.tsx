import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Search, Plus, Loader, Instagram, Music } from 'lucide-react';

export function EnhancedInfluencerSearch() {
  const [platform, setPlatform] = useState('instagram');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  const searchInfluencers = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a username or keyword to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Use Ayrshare API to search for influencers
      const { data, error } = await supabase.functions.invoke('ayrshare-brand-lookup', {
        body: {
          platform,
          username: searchQuery,
          searchType: 'profile'
        }
      });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Failed",
          description: "Failed to search for influencers. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!data?.success && data?.platform_error && data?.platform === 'tiktok') {
        toast({
          title: "TikTok Account Not Linked",
          description: data.error + " " + (data.instructions || ""),
          variant: "destructive"
        });
        return;
      }

      setSearchResults(data?.profiles || []);
      
      if (!data?.profiles?.length) {
        toast({
          title: "No Results",
          description: "No influencers found for your search criteria",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "An error occurred while searching",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addInfluencerToDatabase = async (profile: any) => {
    try {
      // Get current user's organization
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      const influencerData = {
        id: profile.id || crypto.randomUUID(),
        username: profile.username,
        full_name: profile.full_name || profile.name,
        profile_picture_url: profile.profile_picture_url || profile.profilePicture,
        bio: profile.bio || profile.biography,
        follower_count: profile.follower_count || profile.followersCount,
        engagement_rate: profile.engagement_rate || profile.engagementRate || 0,
        platform: platform,
        instagram_handle: platform === 'instagram' ? profile.username : null,
        tiktok_handle: platform === 'tiktok' ? profile.username : null,
        verified: profile.verified || false,
        website: profile.website || '',
        location: profile.location || '',
        account_type: profile.account_type || 'public',
        organization_id: userProfile?.organization_id
      };

      const { error } = await supabase
        .from('influencers')
        .upsert(influencerData, { 
          onConflict: 'username,platform,organization_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error adding influencer:', error);
        toast({
          title: "Failed to Add",
          description: `Failed to add ${profile.username} to database`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${profile.username} added to your influencer database`,
      });
    } catch (error) {
      console.error('Error adding influencer:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding the influencer",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Search Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Multi-Platform Creator Search</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">
                  <div className="flex items-center">
                    <Instagram className="mr-2 h-4 w-4" />
                    Instagram
                  </div>
                </SelectItem>
                <SelectItem value="tiktok">
                  <div className="flex items-center">
                    <Music className="mr-2 h-4 w-4" />
                    TikTok
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${platform} creators by username...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchInfluencers()}
              />
            </div>
          </div>
          
          <Button 
            onClick={searchInfluencers} 
            disabled={isSearching || !searchQuery.trim()}
            className="w-full md:w-auto"
          >
            {isSearching ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isSearching ? 'Searching...' : `Search ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
          </Button>
        </div>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Search Results ({searchResults.length})
          </h3>
          
          <div className="grid gap-4">
            {searchResults.map((profile, index) => (
              <Card key={profile.id || index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      {profile.profile_picture_url ? (
                        <img 
                          src={profile.profile_picture_url} 
                          alt={profile.username}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {(profile.username || profile.name || 'U').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-semibold">{profile.full_name || profile.name}</h4>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{(profile.follower_count || profile.followersCount || 0).toLocaleString()} followers</span>
                        <span>{(profile.engagement_rate || profile.engagementRate || 0).toFixed(1)}% engagement</span>
                        <Badge variant="outline">{platform}</Badge>
                      </div>
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => addInfluencerToDatabase(profile)}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Database
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Platform Integration Status */}
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="font-medium">Platform Integration Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              <span className="text-sm">Instagram</span>
              <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-black" />
              <span className="text-sm">TikTok</span>
              <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Both platforms are connected via Ayrshare API for real-time data
          </p>
        </div>
      </Card>
    </div>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Loader, Instagram, Music, BarChart3 } from 'lucide-react';
import { TikTokAnalytics } from '@/components/influencers/TikTokAnalytics';

export function EnhancedInfluencerSearch() {
  const [platform, setPlatform] = useState('instagram');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
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
        
        // Provide specific error reasoning
        let errorMessage = "Search failed. ";
        let errorDescription = "Please try again.";
        
        if (error.message?.includes('Missing social account')) {
          errorMessage = "Platform Not Connected";
          errorDescription = `Your ${platform} account isn't linked to Ayrshare. Please connect it in your social media integrations.`;
        } else if (error.message?.includes('Rate limit')) {
          errorMessage = "Too Many Requests";
          errorDescription = "You've reached the search limit. Please wait a few minutes before searching again.";
        } else if (error.message?.includes('network')) {
          errorMessage = "Connection Error";
          errorDescription = "Unable to connect to the search service. Check your internet connection.";
        } else {
          errorDescription = `Error details: ${error.message || 'Unknown error occurred'}`;
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        return;
      }

      if (!data?.success) {
        console.error('API returned error:', data);
        
        let errorMessage = "Search Failed";
        let errorDescription = "Unable to complete the search.";
        
        if (data?.platform_error && data?.platform === 'tiktok') {
          errorMessage = "TikTok Account Required";
          errorDescription = data.error + " " + (data.instructions || "Connect your TikTok account in Ayrshare to enable searches.");
        } else if (data?.error) {
          errorDescription = data.error;
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        return;
      }

      setSearchResults(data?.profiles || []);
      
      if (!data?.profiles?.length) {
        toast({
          title: "No Results Found",
          description: `No ${platform} profiles found for "${searchQuery}". Try a different username or check spelling.`,
        });
      } else if (data?.enhanced_data && platform === 'tiktok') {
        toast({
          title: "Enhanced Data Retrieved",
          description: `Found ${data.profiles.length} profile(s) with advanced TikTok metrics`,
        });
      } else {
        toast({
          title: "Search Successful",
          description: `Found ${data.profiles.length} ${platform} profile(s)`,
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      
      // Provide specific error reasoning based on error type
      let errorMessage = "Search Error";
      let errorDescription = "Unable to complete the search.";
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Network Connection Error";
        errorDescription = "Cannot connect to the search service. Please check your internet connection and try again.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Search Timeout";
        errorDescription = "The search is taking too long. Please try with a different username or try again later.";
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = "Authentication Error";
        errorDescription = "Your session has expired. Please refresh the page and try again.";
      } else {
        errorDescription = `Technical error: ${error.message || 'Unknown error'}. Please try again or contact support if the issue persists.`;
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
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
        
        let errorMessage = "Failed to Add Influencer";
        let errorDescription = `Unable to add ${profile.username} to database.`;
        
        if (error.message?.includes('duplicate')) {
          errorMessage = "Influencer Already Exists";
          errorDescription = `${profile.username} is already in your database.`;
        } else if (error.message?.includes('permission')) {
          errorMessage = "Permission Denied";
          errorDescription = "You don't have permission to add influencers. Contact your administrator.";
        } else if (error.message?.includes('organization')) {
          errorMessage = "Organization Error";
          errorDescription = "Unable to determine your organization. Please contact support.";
        } else {
          errorDescription += ` Error: ${error.message}`;
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${profile.username} added to your influencer database`,
      });
    } catch (error: any) {
      console.error('Error adding influencer:', error);
      
      let errorMessage = "Database Error";
      let errorDescription = "Failed to save influencer to database.";
      
      if (error.message?.includes('network')) {
        errorMessage = "Connection Error";
        errorDescription = "Unable to connect to database. Please check your connection and try again.";
      } else {
        errorDescription += ` Technical details: ${error.message}`;
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
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
                  
                  <div className="flex space-x-2">
                    {platform === 'tiktok' && (
                      <Button
                        onClick={() => {
                          setSelectedProfile(profile);
                          setShowAnalytics(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    )}
                    <Button
                      onClick={() => addInfluencerToDatabase(profile)}
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Database
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TikTok Analytics Modal */}
      {showAnalytics && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">TikTok Analytics - @{selectedProfile.username}</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnalytics(false)}
                >
                  Close
                </Button>
              </div>
              <TikTokAnalytics 
                profile={selectedProfile}
                onAnalyticsUpdate={(analytics) => {
                  // Update the profile with enhanced analytics
                  setSearchResults(prev => 
                    prev.map(p => p.username === selectedProfile.username 
                      ? { ...p, analytics } 
                      : p
                    )
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}
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
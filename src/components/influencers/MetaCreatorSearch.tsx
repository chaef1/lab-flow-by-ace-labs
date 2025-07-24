
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, TrendingUp, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hasMetaToken } from "@/lib/ads-api";

interface Creator {
  id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  follower_count: number;
  media_count?: number;
  biography?: string;
  is_verified?: boolean;
  category?: string;
}

export default function MetaCreatorSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const { toast } = useToast();
  
  const isMetaConnected = hasMetaToken();
  
  const { data: creators, isLoading, error, refetch, isError, isFetched } = useQuery({
    queryKey: ['metaCreators', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      
      console.log("Searching Meta creators with query:", searchQuery);
      
      const { data, error } = await supabase.functions.invoke('meta-creators', {
        body: { 
          query: searchQuery,
          action: 'search_creators'
        }
      });
      
      if (error) {
        console.error("Meta creator search error:", error);
        throw new Error(error.message);
      }
      
      if (!data?.data) {
        console.error("Invalid response format from meta-creators function:", data);
        return [];
      }
      
      console.log("Meta creators search result:", data);
      return data.data || [];
    },
    enabled: false, // Don't run query on mount
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters to search",
        variant: "destructive",
      });
      return;
    }
    
    refetch();
  };
  
  const handleAddInfluencer = async (creator: Creator) => {
    try {
      // Check if influencer already exists
      const { data: existingInfluencer } = await supabase
        .from('influencers')
        .select('id')
        .eq('instagram_handle', creator.username)
        .maybeSingle();
      
      if (existingInfluencer) {
        toast({
          title: "Influencer already exists",
          description: "This creator is already in your database",
          variant: "default",
        });
        return;
      }
      
      // Generate a new UUID for the profile/influencer
      const newId = crypto.randomUUID();
      
      // Create a new profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newId,
          first_name: creator.name.split(' ')[0] || '',
          last_name: creator.name.split(' ').slice(1).join(' ') || '',
          avatar_url: creator.profile_picture_url || '',
          role: 'influencer'
        });
        
      if (profileError) throw profileError;
      
      // Now create the influencer record
      const { error: influencerError } = await supabase
        .from('influencers')
        .insert({
          id: newId,
          bio: creator.biography || '',
          follower_count: creator.follower_count || 0,
          engagement_rate: 0, // Would need to calculate this separately
          instagram_handle: creator.username,
          categories: creator.category ? [creator.category] : []
        });
        
      if (influencerError) throw influencerError;
      
      // Clear selection and show success message
      setSelectedCreator(null);
      
      toast({
        title: "Influencer added",
        description: "Successfully added creator to your database",
      });
      
    } catch (error: any) {
      console.error("Error adding creator as influencer:", error);
      toast({
        title: "Failed to add influencer",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  if (!isMetaConnected) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to connect your Meta account to search for creators.
          Please visit the Advertising page to connect your account.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Find Meta Creators</CardTitle>
        <CardDescription>
          Search for Instagram creators through the Meta Graph API. Only connected business accounts will be searchable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input 
              placeholder="Search by name or topic..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
          
          {isFetched && creators && creators.length === 0 && searchQuery && (
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                No creators found. The Meta Graph API only allows searching within your connected business accounts or requires advanced API permissions for broader discovery.
              </AlertDescription>
            </Alert>
          )}
          
          {isError && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error searching creators: {error instanceof Error ? error.message : "Unknown error"}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Search results */}
          <div className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : creators && creators.length > 0 ? (
              <>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Found {creators.length} creators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creators.map((creator: Creator) => (
                    <Card 
                      key={creator.id} 
                      className={`cursor-pointer transition-all ${selectedCreator?.id === creator.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedCreator(creator)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={creator.profile_picture_url} />
                            <AvatarFallback>{creator.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <h4 className="font-medium">{creator.name}</h4>
                              {creator.is_verified && (
                                <Badge variant="secondary" className="ml-2">Verified</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{creator.username}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm">
                          <p className="text-muted-foreground">
                            {creator.follower_count?.toLocaleString() || '0'} followers
                          </p>
                          {creator.category && (
                            <Badge variant="outline" className="mt-2">{creator.category}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : searchQuery && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                No creators found matching your search.
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
      
      {selectedCreator && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => handleAddInfluencer(selectedCreator)}
          >
            <TrendingUp className="mr-2 h-4 w-4" /> 
            Add to Influencer Database
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

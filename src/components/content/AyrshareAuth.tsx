import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, XCircle, Unlink, Loader, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConnectedProfile {
  platform: string;
  username: string;
  profileKey: string;
  status: string;
}

interface AyrshareAuthProps {
  onAuthChange: () => void;
}

export function AyrshareAuth({ onAuthChange }: AyrshareAuthProps) {
  const [connectedProfiles, setConnectedProfiles] = useState<ConnectedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConnectedProfiles([]);
        return;
      }

      // Get user's profile key
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.ayrshare_profile_key) {
        setConnectedProfiles([]);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: { 
          action: 'get_profiles',
          profileKey: profile.ayrshare_profile_key
        }
      });

      if (error) throw error;

      if (data.success && data.data) {
        const profiles = data.data.profiles || [];
        setConnectedProfiles(profiles);
        onAuthChange();
      }
    } catch (error: any) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Failed to load connected accounts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectAccounts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First check if user has an Ayrshare profile, if not create one
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      let profileKey = profile?.ayrshare_profile_key;

      if (!profileKey) {
        // Create Ayrshare profile first
        const { data: createData, error: createError } = await supabase.functions.invoke('ayrshare-auth', {
          body: { 
            action: 'create_profile',
            userId: user.id,
            userName: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email
          }
        });

        if (createError) throw createError;

        if (!createData.success) {
          throw new Error(createData.error || 'Failed to create Ayrshare profile');
        }

        profileKey = createData.data.profileKey;
      }
      
      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: { 
          action: 'get_auth_url',
          profileKey: profileKey
        }
      });

      if (error) throw error;

      if (data.success && data.data.url) {
        // Open auth URL in a popup
        const popup = window.open(
          data.data.url, 
          'ayrshare_auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Check for popup completion with better messaging
        let checkCount = 0;
        const maxChecks = 300; // 5 minutes (checking every second)
        
        const checkClosed = setInterval(() => {
          checkCount++;
          
          if (popup.closed) {
            clearInterval(checkClosed);
            
            toast({
              title: "Authentication window closed",
              description: "Checking for connected accounts...",
            });
            
            // Refresh profiles after auth
            setTimeout(() => {
              loadProfiles();
            }, 2000);
          } else if (checkCount >= maxChecks) {
            // JWT expired (5 minutes)
            clearInterval(checkClosed);
            popup.close();
            
            toast({
              title: "Authentication session expired",
              description: "Please try connecting your accounts again.",
              variant: "destructive"
            });
          }
        }, 1000);
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error: any) {
      console.error('Error getting auth URL:', error);
      toast({
        title: "Failed to start authentication",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkProfile = async (profileKey: string, platform: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: { 
          action: 'unlink_profile',
          profileKey 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Account disconnected",
          description: `${platform} account has been disconnected`
        });
        loadProfiles();
      } else {
        throw new Error(data.error || 'Failed to unlink profile');
      }
    } catch (error: any) {
      console.error('Error unlinking profile:', error);
      toast({
        title: "Failed to disconnect account",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'bg-blue-100 text-blue-800',
      instagram: 'bg-pink-100 text-pink-800',
      twitter: 'bg-sky-100 text-sky-800',
      linkedin: 'bg-blue-100 text-blue-800',
      youtube: 'bg-red-100 text-red-800',
      tiktok: 'bg-gray-100 text-gray-800'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Social Media Accounts
          <Button
            variant="outline"
            size="sm"
            onClick={loadProfiles}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to post content across platforms
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {connectedProfiles.length === 0 ? (
          <Alert>
            <AlertDescription>
              No social media accounts connected. Connect your accounts to start posting.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Connected Accounts</h3>
            {connectedProfiles.map((profile, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getPlatformColor(profile.platform)}>
                    {profile.platform}
                  </Badge>
                  <span className="font-medium">{profile.username || 'Unknown'}</span>
                  {profile.status === 'active' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlinkProfile(profile.profileKey, profile.platform)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleConnectAccounts}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Opening Authentication...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect Social Media Accounts
            </>
          )}
        </Button>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>Note:</strong> You'll be redirected to Ayrshare to authenticate with your social media accounts. 
            This is secure and allows you to post to multiple platforms from one place.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
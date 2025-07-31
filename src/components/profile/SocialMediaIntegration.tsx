import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader, RefreshCw, Instagram, Youtube, Linkedin, Twitter, Facebook, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlatformCard } from './PlatformCard';

interface ConnectedProfile {
  platform: string;
  username: string;
  profileKey: string;
  status: string;
}

export function SocialMediaIntegration() {
  const [connectedProfiles, setConnectedProfiles] = useState<ConnectedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, gradient: 'from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, gradient: 'from-blue-500 to-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, gradient: 'from-sky-400 to-blue-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, gradient: 'from-blue-600 to-blue-700' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, gradient: 'from-red-500 to-red-600' },
    { id: 'tiktok', name: 'TikTok', icon: () => <div className="text-sm font-bold">♪</div>, gradient: 'from-black to-gray-800' }
  ];

  useEffect(() => {
    loadConnectedProfiles();
  }, []);

  const loadConnectedProfiles = async () => {
    setIsLoading(true);
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
      }
    } catch (error: any) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Failed to load connected accounts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    setIsConnecting(true);
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
              loadConnectedProfiles();
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
      console.error('Error connecting platform:', error);
      toast({
        title: "Failed to start authentication",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPlatform = async (profileKey: string, platform: string) => {
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
        loadConnectedProfiles();
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

  const getConnectedProfile = (platformId: string) => {
    return connectedProfiles.find(profile => 
      profile.platform.toLowerCase() === platformId.toLowerCase()
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social Media Integration</CardTitle>
            <CardDescription>
              Connect your social media accounts to enable cross-platform posting
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadConnectedProfiles}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {connectedProfiles.length === 0 && !isLoading && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Connect your social media accounts to start posting across platforms. 
              Each platform requires separate authentication through their secure login process.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {platforms.map((platform) => {
            const connectedProfile = getConnectedProfile(platform.id);
            
            return (
              <PlatformCard
                key={platform.id}
                platform={platform}
                connectedProfile={connectedProfile}
                onConnect={handleConnectPlatform}
                onDisconnect={handleDisconnectPlatform}
                isConnecting={isConnecting}
              />
            );
          })}
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>How it works:</strong> Click "Connect" to authenticate with each platform through Ayrshare's secure integration. 
            Once connected, you can schedule posts across all linked platforms from the Content Scheduler.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>Setup Required:</strong> If authentication fails, please check that your Ayrshare private key is properly configured with the correct RSA format including header/footer lines.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
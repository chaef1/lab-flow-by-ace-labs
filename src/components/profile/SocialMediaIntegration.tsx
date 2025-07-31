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
  activeSocialAccounts?: string[];
}

export function SocialMediaIntegration() {
  const [connectedProfiles, setConnectedProfiles] = useState<ConnectedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

  // Add effect to reload profiles when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, 'User ID:', session?.user?.id, 'Email:', session?.user?.email);
      
      const newUserId = session?.user?.id || null;
      
      // If user changed, force complete reset
      if (currentUserId !== newUserId) {
        console.log('🔄 User ID changed from', currentUserId, 'to', newUserId, '- forcing complete reset');
        setCurrentUserId(newUserId);
        setConnectedProfiles([]); // Clear immediately
        setIsLoading(false);
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('🔄 User signed out - clearing connected profiles immediately');
        setConnectedProfiles([]);
        setCurrentUserId(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' && newUserId) {
        console.log('🔄 User signed in - loading profiles for user:', newUserId);
        setCurrentUserId(newUserId);
        // Small delay to ensure auth state is fully settled
        setTimeout(() => loadConnectedProfiles(), 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [currentUserId]);

  const loadConnectedProfiles = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 loadConnectedProfiles - Current user:', user?.id, user?.email);
      
      if (!user) {
        console.log('🔍 No user found, clearing profiles');
        setConnectedProfiles([]);
        return;
      }

      // Get user's profile key
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      console.log('🔍 Profile query result:', { profile, profileError, userId: user.id });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.ayrshare_profile_key) {
        console.log('🔍 No ayrshare profile key found for user', user.id);
        setConnectedProfiles([]);
        return;
      }

      console.log('🔍 Using profile key:', profile.ayrshare_profile_key, 'for user:', profile.first_name, profile.last_name);

      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: { 
          action: 'get_profiles',
          profileKey: profile.ayrshare_profile_key
        }
      });

      console.log('🔍 Ayrshare response:', data);

      if (error) throw error;

      if (data.success && data.data) {
        const profiles = data.data.profiles || [];
        console.log('🔍 Setting connected profiles for user', user.id, ':', profiles);
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
      console.log('🔗 Connecting platform for user:', user?.id, user?.email);
      if (!user) throw new Error('User not authenticated');

      // First check if user has an Ayrshare profile, if not create one
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('ayrshare_profile_key, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      console.log('🔗 Profile data for connection:', { profile, userId: user.id });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      let profileKey = profile?.ayrshare_profile_key;
      console.log('🔗 Using profile key for auth URL:', profileKey);

      if (!profileKey) {
        console.log('🔗 No profile key found, creating new Ayrshare profile for user:', user.id);
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
        console.log('🔗 Created new profile key:', profileKey);
      }
      
      console.log('🔗 Requesting auth URL with profile key:', profileKey, 'for user:', profile?.first_name, profile?.last_name);
      
      const { data, error } = await supabase.functions.invoke('ayrshare-auth', {
        body: { 
          action: 'get_auth_url',
          profileKey: profileKey
        }
      });

      console.log('🔗 Auth URL response:', data);

      if (error) throw error;

      if (data.success && data.data.url) {
        // Open auth URL in a properly configured popup that won't redirect parent
        const popup = window.open(
          data.data.url, 
          'ayrshare_auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Prevent popup from affecting parent window
        popup.focus();

        // Listen for messages from the popup
        const messageListener = (event: MessageEvent) => {
          // Only accept messages from Ayrshare domain
          if (event.origin !== 'https://profile.ayrshare.com') {
            return;
          }

          if (event.data.type === 'AYRSHARE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            popup.close();
            
            toast({
              title: "Authentication successful",
              description: "Your account has been connected successfully!",
            });
            
            loadConnectedProfiles();
          } else if (event.data.type === 'AYRSHARE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            popup.close();
            
            toast({
              title: "Authentication failed",
              description: event.data.message || "There was an error connecting your account.",
              variant: "destructive"
            });
          }
        };

        window.addEventListener('message', messageListener);

        // Fallback: Check if popup is closed manually
        let checkCount = 0;
        const maxChecks = 300; // 5 minutes
        
        const checkClosed = setInterval(() => {
          checkCount++;
          
          try {
            // Check if popup is closed
            if (popup.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              
              toast({
                title: "Authentication window closed",
                description: "Checking for connected accounts...",
              });
              
              // Refresh profiles after popup closes with multiple attempts
              let attempts = 0;
              const maxAttempts = 3;
              
              const checkForNewConnection = async () => {
                attempts++;
                await loadConnectedProfiles();
                
                // If still no new connections after a few seconds, try again
                if (attempts < maxAttempts) {
                  setTimeout(checkForNewConnection, 3000);
                }
              };
              
              setTimeout(checkForNewConnection, 2000);
            } else if (checkCount >= maxChecks) {
              // Session expired
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              
              if (!popup.closed) {
                popup.close();
              }
              
              toast({
                title: "Authentication session expired",
                description: "Please try connecting your accounts again.",
                variant: "destructive"
              });
            }
          } catch (e) {
            // Popup might be from different origin, can't access its properties
            // Continue checking
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

  const getConnectedProfile = (platformId: string): ConnectedProfile | undefined => {
    console.log('Checking connection for platform:', platformId);
    console.log('Available profiles:', connectedProfiles);
    
    const mainProfile = connectedProfiles.find(profile => profile.status === 'active');
    if (!mainProfile) {
      console.log('No active profile found');
      return undefined;
    }
    
    console.log('Main profile:', mainProfile);
    
    // Check if the platform is in activeSocialAccounts array
    if (mainProfile.activeSocialAccounts && Array.isArray(mainProfile.activeSocialAccounts)) {
      const isConnected = mainProfile.activeSocialAccounts.includes(platformId.toLowerCase());
      console.log(`Platform ${platformId} connected:`, isConnected);
      
      if (isConnected) {
        // Return a synthetic profile for this platform
        return {
          platform: platformId,
          username: mainProfile.username,
          profileKey: mainProfile.profileKey,
          status: mainProfile.status,
          activeSocialAccounts: mainProfile.activeSocialAccounts
        };
      }
    }
    
    // Fallback to platform field matching (old format)
    const platformProfile = connectedProfiles.find(profile => 
      profile.platform.toLowerCase() === platformId.toLowerCase() && 
      profile.status === 'active'
    );
    
    console.log(`Platform ${platformId} fallback match:`, !!platformProfile);
    return platformProfile;
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
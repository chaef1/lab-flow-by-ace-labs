import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Key, Facebook, CheckCircle, AlertCircle, User } from 'lucide-react';
import { getMetaOAuthUrl, getMetaUserProfile } from '@/lib/api/meta-api';
import { getSavedMetaToken } from '@/lib/storage/token-storage';
import MetaTokenManager from './MetaTokenManager';

interface AuthSelectorProps {
  isConnected: boolean;
  onAuthChange: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ isConnected, onAuthChange }) => {
  const [selectedMethod, setSelectedMethod] = useState<'oauth' | 'token'>('oauth');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Load user profile when connected
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isConnected) {
        setIsLoadingProfile(true);
        try {
          const tokenData = getSavedMetaToken();
          if (tokenData.accessToken) {
            const profile = await getMetaUserProfile(tokenData.accessToken);
            if (profile) {
              setUserProfile(profile);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setUserProfile(null);
      }
    };

    loadUserProfile();
  }, [isConnected]);

  const handleConnectMeta = () => {
    const authUrl = getMetaOAuthUrl();
    console.log('Opening Meta OAuth URL:', authUrl);
    
    const popup = window.open(authUrl, 'meta_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
    
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'META_OAUTH_SUCCESS') {
        console.log('OAuth success received in main window', event.data);
        popup?.close();
        
        // Wait a moment for storage to be written, then update state
        setTimeout(() => {
          // Trigger the meta_auth_changed event to update all listeners
          window.dispatchEvent(new Event('meta_auth_changed'));
          
          // Also call the onAuthChange callback directly
          onAuthChange();
        }, 200);
        
        window.removeEventListener('message', handleMessage);
      } else if (event.data.type === 'META_OAUTH_ERROR') {
        console.error('OAuth error received in main window:', event.data.error);
        popup?.close();
        window.removeEventListener('message', handleMessage);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Clean up if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Connected to Meta
          </CardTitle>
          <CardDescription>
            Your Meta account is successfully connected and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Profile Display */}
          {isLoadingProfile ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ) : userProfile ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              {userProfile.picture?.data?.url ? (
                <img 
                  src={userProfile.picture.data.url} 
                  alt={userProfile.name}
                  className="h-12 w-12 rounded-full border-2 border-green-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              )}
              <div>
                <p className="font-semibold text-green-900">{userProfile.name}</p>
                {userProfile.email && (
                  <p className="text-sm text-green-700">{userProfile.email}</p>
                )}
                <p className="text-xs text-green-600">ID: {userProfile.id}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">Connected but unable to load profile information</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active Connection
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Force a reconnection by clearing tokens and refreshing
                localStorage.removeItem('meta_auth_data');
                onAuthChange();
              }}
            >
              Reconnect Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Connect to Meta Advertising
          </CardTitle>
          <CardDescription>
            Choose how you want to connect to Meta (Facebook/Instagram) for advertising features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'oauth' | 'token')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oauth" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook Login
              </TabsTrigger>
              <TabsTrigger value="token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Token
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="oauth" className="space-y-4">
              <div className="border rounded-lg p-6 bg-blue-50/50">
                <h3 className="font-semibold text-blue-900 mb-2">Facebook OAuth (Recommended)</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Connect using your Facebook account for the most secure and convenient experience. 
                  This will give you access to all your Facebook pages, Instagram accounts, and ad accounts.
                </p>
                <div className="space-y-2 text-sm text-blue-700 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Access to all connected Facebook pages
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Automatic token refresh
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Secure permission management
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Access to Instagram Business accounts
                  </div>
                </div>
                <Button onClick={handleConnectMeta} className="w-full">
                  <Facebook className="h-4 w-4 mr-2" />
                  Connect with Facebook
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="token" className="space-y-4">
              <div className="border rounded-lg p-6 bg-orange-50/50">
                <h3 className="font-semibold text-orange-900 mb-2">Meta Marketing API Token</h3>
                <p className="text-sm text-orange-800 mb-4">
                  Use a Meta Marketing API token if you have one from the Meta Developer Console. 
                  This method requires manual token management.
                </p>
                <div className="space-y-2 text-sm text-orange-700 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Requires manual token renewal
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Limited to specific ad accounts
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    More complex setup process
                  </div>
                </div>
              </div>
              
              <MetaTokenManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSelector;
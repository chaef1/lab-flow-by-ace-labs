import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Key, Facebook, CheckCircle, AlertCircle } from 'lucide-react';
import { getMetaOAuthUrl } from '@/lib/api/meta-api';
import MetaTokenManager from './MetaTokenManager';

interface AuthSelectorProps {
  isConnected: boolean;
  onAuthChange: () => void;
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ isConnected, onAuthChange }) => {
  const [selectedMethod, setSelectedMethod] = useState<'oauth' | 'token'>('oauth');

  const handleConnectMeta = () => {
    const authUrl = getMetaOAuthUrl();
    console.log('Opening Meta OAuth URL:', authUrl);
    
    const popup = window.open(authUrl, 'meta_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
    
    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'META_OAUTH_SUCCESS') {
        console.log('OAuth success received in main window');
        popup?.close();
        onAuthChange(); // Refresh the connection status
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
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active Connection
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Force a reconnection by clearing tokens and refreshing
                localStorage.removeItem('meta_token_data');
                onAuthChange();
                window.location.reload();
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
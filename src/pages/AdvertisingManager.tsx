
import { Suspense, useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/Dashboard';
import { Loader } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdPerformance from '@/components/advertising/AdPerformance';
import CampaignCreator from '@/components/advertising/CampaignCreator';
import MediaUploader from '@/components/advertising/MediaUploader';
import AdWallet from '@/components/wallet/AdWallet';
import AuthSelector from '@/components/advertising/AuthSelector';
import { hasMetaToken } from '@/lib/storage/token-storage';

const AdvertisingManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMetaConnected, setIsMetaConnected] = useState(false);

  useEffect(() => {
    // Persist tab selection in localStorage
    const storedTab = localStorage.getItem('advertising_active_tab');
    if (storedTab) {
      setActiveTab(storedTab);
    }
  }, []);

  useEffect(() => {
    // Update localStorage when activeTab changes
    localStorage.setItem('advertising_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Check if this is an OAuth callback by looking for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state && window.opener) {
      // This is an OAuth callback in a popup window
      console.log('OAuth callback detected, processing...', { code: code.substring(0, 10) + '...', state });
      
      // Import and process the OAuth callback
      import('@/lib/api/meta-api').then(({ processMetaAuthCallback }) => {
        processMetaAuthCallback(window.location.href)
          .then((result) => {
            console.log('OAuth processed successfully, notifying parent', result);
            if (result.success) {
              // Ensure the token is properly saved with account ID
              if (result.token && result.accountId) {
                import('@/lib/storage/token-storage').then(({ saveMetaToken }) => {
                  const saved = saveMetaToken(result.token, result.accountId);
                  console.log('Token saved with account ID:', result.accountId, 'Success:', saved);
                  
                  // Dispatch the meta_auth_changed event after saving
                  window.opener.dispatchEvent(new Event('meta_auth_changed'));
                });
              }
              
              window.opener.postMessage({ 
                type: 'META_OAUTH_SUCCESS', 
                token: result.token,
                accountId: result.accountId,
                userProfile: result.userProfile
              }, window.location.origin);
            } else {
              window.opener.postMessage({ 
                type: 'META_OAUTH_ERROR', 
                error: result.error 
              }, window.location.origin);
            }
          })
          .catch((error) => {
            console.error('OAuth processing failed:', error);
            window.opener.postMessage({ 
              type: 'META_OAUTH_ERROR', 
              error: error.message 
            }, window.location.origin);
          });
      });
      
      return; // Don't continue with normal initialization
    }

    // Check Meta token status on component mount
    const checkMetaConnection = () => {
      const connected = hasMetaToken();
      console.log('Checking Meta connection status:', connected);
      setIsMetaConnected(connected);
    };

    checkMetaConnection();

    // Listen for Meta auth changes
    const handleMetaAuthChange = () => {
      console.log('Meta auth changed, rechecking connection');
      checkMetaConnection();
    };

    window.addEventListener('meta_auth_changed', handleMetaAuthChange);

    return () => {
      window.removeEventListener('meta_auth_changed', handleMetaAuthChange);
    };
  }, []);

  const handleAuthChange = () => {
    // Use a small delay to ensure localStorage is updated
    setTimeout(() => {
      const connected = hasMetaToken();
      console.log('Auth changed, new connection status:', connected);
      setIsMetaConnected(connected);
    }, 100);
  };

  return (
    <DashboardLayout title="Advertising Manager" subtitle="Manage your advertising campaigns across platforms">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading advertising dashboard...</p>
            </div>
          </div>
        }>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="tokens">API Tokens</TabsTrigger>
              <TabsTrigger value="creatives">Creatives</TabsTrigger>
              <TabsTrigger value="wallet">Ad Wallet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <AdPerformance platform="meta" />
            </TabsContent>
            
            <TabsContent value="campaigns">
              {!isMetaConnected && (
                <AuthSelector 
                  isConnected={isMetaConnected}
                  onAuthChange={handleAuthChange}
                />
              )}
              {isMetaConnected && (
                <CampaignCreator 
                  isConnected={isMetaConnected}
                  platform="meta"
                />
              )}
            </TabsContent>

            <TabsContent value="tokens">
              <AuthSelector 
                isConnected={isMetaConnected}
                onAuthChange={handleAuthChange}
              />
            </TabsContent>
            
            <TabsContent value="creatives">
              <MediaUploader platform="meta" />
            </TabsContent>
            
            <TabsContent value="wallet">
              <AdWallet />
            </TabsContent>
          </Tabs>
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default AdvertisingManager;

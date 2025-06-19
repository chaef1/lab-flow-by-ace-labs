
import { Suspense, useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/Dashboard';
import { Loader } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdPerformance from '@/components/advertising/AdPerformance';
import CampaignCreator from '@/components/advertising/CampaignCreator';
import MediaUploader from '@/components/advertising/MediaUploader';
import AdWallet from '@/components/wallet/AdWallet';
import MetaTokenManager from '@/components/advertising/MetaTokenManager';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle } from "lucide-react";
import { hasMetaToken } from '@/lib/storage/token-storage';
import { getMetaOAuthUrl } from '@/lib/api/meta-api';

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

  const handleConnectMeta = () => {
    const authUrl = getMetaOAuthUrl();
    console.log('Opening Meta OAuth URL:', authUrl);
    window.open(authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
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
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Connect your Meta account to access campaign management features.</span>
                    <Button onClick={handleConnectMeta} size="sm" className="ml-4">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Meta Account
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <CampaignCreator 
                isConnected={isMetaConnected}
                platform="meta"
              />
            </TabsContent>

            <TabsContent value="tokens">
              <MetaTokenManager />
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

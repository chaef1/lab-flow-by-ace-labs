import { Suspense, useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/Dashboard';
import { Loader } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdPerformance from '@/components/advertising/AdPerformance';
import CampaignList from '@/components/advertising/CampaignList';
import MediaUploader from '@/components/advertising/MediaUploader';
import AdWallet from '@/components/advertising/AdWallet';
import MetaTokenManager from '@/components/advertising/MetaTokenManager';

const AdvertisingManager = () => {
  const [activeTab, setActiveTab] = useState('overview');

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
              <AdPerformance />
            </TabsContent>
            
            <TabsContent value="campaigns">
              <CampaignList />
            </TabsContent>

            <TabsContent value="tokens">
              <MetaTokenManager />
            </TabsContent>
            
            <TabsContent value="creatives">
              <MediaUploader />
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

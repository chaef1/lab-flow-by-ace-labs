
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard from "@/components/layout/Dashboard";
import AdAccountSelector from "@/components/advertising/AdAccountSelector";
import CampaignCreator from "@/components/advertising/CampaignCreator";
import MediaUploader from "@/components/advertising/MediaUploader";
import AdPerformance from "@/components/advertising/AdPerformance";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  hasTikTokToken, 
  getSavedTikTokToken, 
  processTikTokAuthCallback, 
  hasMetaToken,
  getSavedMetaToken,
  processMetaAuthCallback,
  getTikTokAuthUrl,
  getMetaOAuthUrl 
} from "@/lib/ads-api";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AdvertisingManager = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'meta'>('tiktok');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for TikTok auth messages from iframe or popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check if the event contains TikTok auth data
      if (event.data && event.data.tiktokAuthCode) {
        console.log('Received TikTok auth code via postMessage:', event.data.tiktokAuthCode.substring(0, 5) + '...');
        
        // Process the authorization code
        setIsProcessingAuth(true);
        try {
          const result = await processTikTokAuthCallback(
            `https://app-sandbox.acelabs.co.za/advertising?code=${event.data.tiktokAuthCode}`
          );
          
          if (result.success) {
            setIsConnected(true);
            setSelectedPlatform('tiktok');
            toast({
              title: "Successfully Connected",
              description: "Your TikTok Ads account has been connected successfully."
            });
          } else {
            throw new Error(result.error || 'Authentication failed');
          }
        } catch (error: any) {
          console.error('Error processing auth code from postMessage:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to complete TikTok authentication",
            variant: "destructive"
          });
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };
    
    // Add the message listener
    window.addEventListener('message', handleMessage);
    
    // Clean up
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // Check for auth code in URL params (direct navigation or redirect case)
  useEffect(() => {
    const processAuthCode = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (code) {
        console.log('Found auth code in URL:', code.substring(0, 5) + '...');
        setIsProcessingAuth(true);
        
        try {
          // First check if this is a TikTok or Meta auth code
          // Meta usually comes with a state parameter
          const state = urlParams.get('state');
          let platform = 'tiktok';
          
          if (state) {
            try {
              const stateObj = JSON.parse(decodeURIComponent(state));
              if (stateObj && stateObj.platform === 'meta') {
                platform = 'meta';
              }
            } catch (e) {
              console.warn('Could not parse state parameter:', e);
            }
          }
          
          console.log(`Processing ${platform} auth code from URL`);
          
          if (platform === 'tiktok') {
            // Process the authorization code for TikTok
            const result = await processTikTokAuthCallback(
              `https://app-sandbox.acelabs.co.za/advertising?code=${code}`
            );
            
            if (result.success) {
              setIsConnected(true);
              setSelectedPlatform('tiktok'); // Ensure we're showing TikTok platform after auth
              toast({
                title: "Successfully Connected",
                description: "Your TikTok Ads account has been connected successfully."
              });
            } else {
              throw new Error(result.error || 'Authentication failed');
            }
          } else if (platform === 'meta') {
            // Process the authorization code for Meta
            const result = await processMetaAuthCallback(window.location.href);
            
            if (result.success) {
              setIsConnected(true);
              setSelectedPlatform('meta'); // Ensure we're showing Meta platform after auth
              toast({
                title: "Successfully Connected",
                description: "Your Meta Ads account has been connected successfully."
              });
            } else {
              throw new Error(result.error || 'Meta authentication failed');
            }
          }
        } catch (error: any) {
          console.error('Error processing auth code from URL:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to complete authentication",
            variant: "destructive"
          });
        } finally {
          setIsProcessingAuth(false);
          
          // Clean up the URL without reloading the page
          navigate('/advertising', { replace: true });
        }
      }
    };
    
    processAuthCode();
  }, [location.search, toast, navigate]);

  // Check for tokens in localStorage that might have been set by direct navigation
  useEffect(() => {
    const checkDirectAuthCode = async () => {
      const storedCode = localStorage.getItem('tiktok_auth_code');
      
      if (storedCode) {
        console.log('Found stored auth code from direct navigation');
        setIsProcessingAuth(true);
        
        try {
          // Remove the code immediately to prevent repeated processing
          localStorage.removeItem('tiktok_auth_code');
          
          // Process the auth code
          const result = await processTikTokAuthCallback(
            `https://app-sandbox.acelabs.co.za/advertising?code=${storedCode}`
          );
          
          if (result.success && result.token) {
            setIsConnected(true);
            setSelectedPlatform('tiktok'); // Ensure we're showing TikTok platform after auth
            toast({
              title: "Successfully Connected",
              description: "Your TikTok Ads account has been connected successfully."
            });
          } else {
            throw new Error(result.error || 'Authentication failed');
          }
        } catch (error: any) {
          console.error('Error processing stored auth code:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to complete TikTok authentication",
            variant: "destructive"
          });
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };
    
    checkDirectAuthCode();
  }, [toast]);

  // Check connection status on mount and token changes
  useEffect(() => {
    const checkConnectionStatus = () => {
      console.log('Checking connection status for platform:', selectedPlatform);
      if (selectedPlatform === 'tiktok') {
        const hasToken = hasTikTokToken();
        console.log('Has TikTok token:', hasToken);
        setIsConnected(hasToken);
        
        if (hasToken) {
          const { accessToken, advertiserId } = getSavedTikTokToken();
          console.log('Using saved token:', accessToken ? 'exists' : 'none', 'Advertiser ID:', advertiserId || 'none');
        }
      } else if (selectedPlatform === 'meta') {
        // Check Meta token status
        const hasToken = hasMetaToken();
        console.log('Has Meta token:', hasToken);
        setIsConnected(hasToken);
        
        if (hasToken) {
          const { accessToken, accountId } = getSavedMetaToken();
          console.log('Using saved Meta token:', accessToken ? 'exists' : 'none', 'Account ID:', accountId || 'none');
        }
      }
    };
    
    checkConnectionStatus();
    
    // Set up an interval to check token status periodically
    const tokenCheckInterval = setInterval(checkConnectionStatus, 60000); // Check every minute
    
    return () => clearInterval(tokenCheckInterval);
  }, [selectedPlatform]);

  // Handle creating a new campaign
  const handleCreateCampaign = () => {
    if (!isConnected) {
      toast({
        title: "Connection Required",
        description: `Please connect your ${selectedPlatform === 'tiktok' ? 'TikTok' : 'Meta'} Ads account first`,
        variant: "destructive"
      });
      return;
    }
    
    // Implementation would continue here in a real app
    toast({
      title: "Creating Campaign",
      description: `Launching ${selectedPlatform === 'tiktok' ? 'TikTok' : 'Meta'} campaign creation workflow`
    });
  };

  // Handle errors in child components
  const handleError = (error: Error) => {
    console.error("Caught error in AdvertisingManager:", error);
    toast({
      title: "An error occurred",
      description: error.message || "Please try again or contact support if the issue persists",
      variant: "destructive",
    });
  };

  // Handle TikTok authentication testing
  const handleTestTikTokAuth = async () => {
    try {
      // Get the auth URL from our edge function
      const { authUrl } = await getTikTokAuthUrl();
      console.log('Opening TikTok auth URL:', authUrl);
      
      // Open the auth URL in a new window
      window.open(authUrl, 'tiktok_auth', 'width=600,height=700');
      
      toast({
        title: "TikTok Authentication",
        description: "Authentication window opened. Please complete the process there."
      });
    } catch (error: any) {
      console.error('Error initiating TikTok authentication:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Could not initiate TikTok authentication",
        variant: "destructive"
      });
    }
  };

  // Handle Meta authentication
  const handleTestMetaAuth = () => {
    try {
      // Get the Meta auth URL
      const metaAuthUrl = getMetaOAuthUrl();
      console.log('Opening Meta auth URL:', metaAuthUrl);
      
      // Open the auth URL in the same window as it will redirect back
      window.location.href = metaAuthUrl;
    } catch (error: any) {
      console.error('Error initiating Meta authentication:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Could not initiate Meta authentication",
        variant: "destructive"
      });
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <Dashboard 
        title="Advertising Manager" 
        subtitle="Create and manage your advertising campaigns"
        showSearch={false}
      >
        <div className="flex flex-col space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Advertising Platform</CardTitle>
                  <CardDescription>Select the platform to create and manage your ads</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={selectedPlatform === 'tiktok' ? 'default' : 'outline'} 
                    onClick={() => setSelectedPlatform('tiktok')}
                    className="flex-1 md:flex-auto"
                  >
                    TikTok Ads
                  </Button>
                  <Button 
                    variant={selectedPlatform === 'meta' ? 'default' : 'outline'} 
                    onClick={() => setSelectedPlatform('meta')}
                    className="flex-1 md:flex-auto"
                  >
                    Meta Ads
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AdAccountSelector 
                platform={selectedPlatform}
                onConnectionStatusChange={setIsConnected}
                isProcessingAuth={isProcessingAuth}
              />
            </CardContent>
          </Card>
          
          <Tabs defaultValue="campaigns" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="creatives">Creative Assets</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Your Campaigns</h3>
                <Button onClick={handleCreateCampaign} disabled={!isConnected}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
                </Button>
              </div>
              <CampaignCreator platform={selectedPlatform} />
            </TabsContent>
            
            <TabsContent value="creatives" className="mt-0">
              <MediaUploader platform={selectedPlatform} />
            </TabsContent>
            
            <TabsContent value="performance" className="mt-0">
              <AdPerformance platform={selectedPlatform} />
            </TabsContent>
          </Tabs>
        </div>
      </Dashboard>
    </ErrorBoundary>
  );
};

export default AdvertisingManager;

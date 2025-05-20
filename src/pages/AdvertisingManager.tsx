
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
import { hasTikTokToken, getSavedTikTokToken, processTikTokAuthCallback } from "@/lib/tiktok-ads-api";
import { useLocation, useNavigate } from "react-router-dom";

const AdvertisingManager = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'meta'>('tiktok');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for auth code in URL params (direct navigation or redirect case)
  useEffect(() => {
    const processAuthCode = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (code) {
        console.log('Found auth code in URL:', code.substring(0, 5) + '...');
        setIsProcessingAuth(true);
        
        try {
          // Process the authorization code
          const result = await processTikTokAuthCallback(
            `https://app-sandbox.acelabs.co.za/advertising?code=${code}`
          );
          
          if (result.success) {
            setIsConnected(true);
            toast({
              title: "Successfully Connected",
              description: "Your TikTok Ads account has been connected successfully."
            });
          } else {
            throw new Error(result.error || 'Authentication failed');
          }
        } catch (error: any) {
          console.error('Error processing auth code from URL:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to complete TikTok authentication",
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
      } else {
        // Meta platform is not available yet
        setIsConnected(false);
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
        description: "Please connect your TikTok Ads account first",
        variant: "destructive"
      });
      return;
    }
    
    // Implementation would continue here in a real app
    toast({
      title: "Creating Campaign",
      description: "Launching campaign creation workflow"
    });
  };

  return (
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
                  disabled
                >
                  Meta Ads (Coming Soon)
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
  );
};

export default AdvertisingManager;

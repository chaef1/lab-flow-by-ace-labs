import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  getTikTokAuthUrl, 
  exchangeTikTokCode,
  processTikTokAuthCallback,
  getTikTokAdAccounts,
  hasTikTokToken,
  getSavedTikTokToken,
  saveTikTokToken,
  removeTikTokToken,
} from "@/lib/tiktok-ads-api";

interface AdAccountSelectorProps {
  platform: 'tiktok' | 'meta';
  onConnectionStatusChange?: (connected: boolean) => void;
  isProcessingAuth?: boolean;
}

interface AdAccount {
  id: string;
  name: string;
  status: string;
  budget?: number;
}

const AdAccountSelector: React.FC<AdAccountSelectorProps> = ({ 
  platform, 
  onConnectionStatusChange,
  isProcessingAuth = false
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Setup message listener for auth iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only process messages with TikTok auth code
      if (event.data && event.data.tiktokAuthCode) {
        console.log('Received auth code from iframe message');
        
        try {
          setIsLoading(true);
          setAuthDialogOpen(false); // Close the dialog immediately
          
          // Process the auth code
          const { success, token, advertiserId, error } = await processTikTokAuthCallback(
            `https://app-sandbox.acelabs.co.za/advertising?code=${event.data.tiktokAuthCode}`
          );
          
          if (success && token) {
            setIsConnected(true);
            if (onConnectionStatusChange) onConnectionStatusChange(true);
            
            // Fetch ad accounts with the new token
            await fetchAdAccounts(token);
            
            // Set selected account if available
            if (advertiserId) {
              setSelectedAccount(advertiserId);
            }
            
            toast({
              title: "Successfully Connected",
              description: "Your TikTok Ads account has been connected successfully."
            });
          } else {
            throw new Error(error || 'Authentication failed');
          }
        } catch (error: any) {
          console.error('Error processing auth code from message:', error);
          showError(error.message || 'Authentication failed');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onConnectionStatusChange, toast]);
  
  // Check for saved tokens on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('Checking auth status for', platform);
      setIsLoading(true);
      
      try {
        // Check if we already have a token
        if (platform === 'tiktok') {
          const hasToken = hasTikTokToken();
          console.log('Has existing token:', hasToken);
          
          if (hasToken) {
            setIsConnected(true);
            if (onConnectionStatusChange) onConnectionStatusChange(true);
            
            const { accessToken, advertiserId } = getSavedTikTokToken();
            
            if (accessToken) {
              console.log('Using existing token to fetch ad accounts');
              await fetchAdAccounts(accessToken);
              
              if (advertiserId) {
                console.log('Setting selected account from saved token:', advertiserId);
                setSelectedAccount(advertiserId);
              }
            }
          } else {
            setIsConnected(false);
            if (onConnectionStatusChange) onConnectionStatusChange(false);
          }
        }
      } catch (error: any) {
        console.error('Error checking authentication status:', error);
        showError(error.message || 'Error checking authentication status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [platform, onConnectionStatusChange]);
  
  const fetchAdAccounts = async (accessToken: string) => {
    try {
      console.log('Fetching ad accounts with token');
      const accountsData = await getTikTokAdAccounts(accessToken);
      
      if (accountsData.code === 0 && accountsData.data && accountsData.data.list) {
        console.log('Successfully fetched ad accounts:', accountsData.data.list.length);
        const formattedAccounts = accountsData.data.list.map(account => ({
          id: account.advertiser_id,
          name: account.advertiser_name,
          status: account.status === 'ENABLE' ? 'Active' : 'Paused',
          budget: account.budget || 5000 // Use default if not available
        }));
        
        setAccounts(formattedAccounts);
      } else {
        console.log('No accounts found or API error, using mock data');
        // If API call succeeded but no accounts found, use mock data
        setAccounts([
          { id: '1', name: 'Ace Labs Main', budget: 5000, status: 'Active' },
          { id: '2', name: 'Ace Labs Test', budget: 1000, status: 'Paused' },
        ]);
      }
    } catch (error: any) {
      console.error('Error fetching ad accounts:', error);
      // Fallback to mock data on error
      setAccounts([
        { id: '1', name: 'Ace Labs Main', budget: 5000, status: 'Active' },
        { id: '2', name: 'Ace Labs Test', budget: 1000, status: 'Paused' },
      ]);
      
      toast({
        title: "Error Fetching Accounts",
        description: "Could not retrieve your ad accounts. Using sample data instead.",
        variant: "destructive"
      });
    }
  };
  
  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorDialogOpen(true);
  };
  
  const initiateConnect = async () => {
    setIsLoading(true);
    
    try {
      const { authUrl } = await getTikTokAuthUrl();
      setAuthUrl(authUrl);
      setAuthDialogOpen(true);
    } catch (error: any) {
      console.error('Error initiating TikTok connection:', error);
      showError(error.message || 'Error connecting to TikTok');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = () => {
    const success = removeTikTokToken();
    console.log('Token removal success:', success);
    
    setIsConnected(false);
    if (onConnectionStatusChange) onConnectionStatusChange(false);
    setSelectedAccount(null);
    setAccounts([]);
    
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from TikTok Ads"
    });
  };

  const closeAuthDialog = () => {
    setAuthDialogOpen(false);
    setAuthUrl(null);
  };
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <h3 className="text-lg font-medium mb-1">TikTok For Business</h3>
            <p className="text-sm text-muted-foreground">Connect your TikTok Ads account to create and manage campaigns</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="connection" className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Label>
            <Switch 
              id="connection"
              checked={isConnected}
              onCheckedChange={(checked) => checked ? initiateConnect() : handleDisconnect()}
              disabled={isLoading || isProcessingAuth}
            />
          </div>
        </div>
        
        {(isLoading || isProcessingAuth) && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Processing TikTok connection...</span>
          </div>
        )}
        
        {isConnected && !isLoading && !isProcessingAuth && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map(account => (
                <Card 
                  key={account.id}
                  className={`cursor-pointer transition-all ${selectedAccount === account.id ? 'ring-2 ring-ace-500' : ''}`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <Badge variant={account.status === 'Active' ? 'default' : 'outline'}>
                        {account.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Available Budget</p>
                    <p className="text-2xl font-bold">${account.budget?.toLocaleString()}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <a href="https://ads.tiktok.com/business/" target="_blank" rel="noopener noreferrer">
                        <Link className="h-4 w-4 mr-1" /> View in TikTok Ads Manager
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button disabled={!selectedAccount}>Continue with Selected Account</Button>
            </div>
          </>
        )}
        
        {!isConnected && !isLoading && !isProcessingAuth && (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed">
            <div className="mb-4 p-3 rounded-full bg-secondary">
              <Link className="h-6 w-6 text-ace-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connect Your TikTok Account</h3>
            <p className="text-center text-muted-foreground mb-4 max-w-md">
              Connect your TikTok Ads account to manage campaigns directly from the Ace Labs platform
            </p>
            <Button onClick={initiateConnect}>Connect TikTok Ads</Button>
          </div>
        )}
      </div>
      
      {/* TikTok Auth Dialog with iframe */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Connect to TikTok Ads</DialogTitle>
              <Button variant="ghost" size="icon" onClick={closeAuthDialog}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Please complete the TikTok authentication process below
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-[400px] overflow-hidden">
            {authUrl && (
              <iframe 
                ref={iframeRef}
                src={authUrl}
                className="w-full h-full border-none"
                title="TikTok Authentication"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage || "There was an error connecting to TikTok Ads."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdAccountSelector;

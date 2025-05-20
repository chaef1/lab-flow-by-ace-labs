import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Setup message listener for auth iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Log all received messages to help with debugging
      console.log('Received message event:', event.data);
      
      // Only process messages with TikTok auth code
      if (event.data && event.data.tiktokAuthCode) {
        console.log('Received auth code from iframe message:', event.data.tiktokAuthCode);
        
        try {
          setIsLoading(true);
          setAuthSheetOpen(false); // Close the sheet immediately
          
          // Process the auth code
          const result = await processTikTokAuthCallback(
            `https://app-sandbox.acelabs.co.za/advertising?code=${event.data.tiktokAuthCode}`
          );
          
          // Store debug info for troubleshooting
          setDebugInfo(result);
          
          if (result.success && result.token) {
            setIsConnected(true);
            if (onConnectionStatusChange) onConnectionStatusChange(true);
            
            // Fetch ad accounts with the new token
            await fetchAdAccounts(result.token);
            
            // Set selected account if available
            if (result.advertiserId) {
              setSelectedAccount(result.advertiserId);
            }
            
            toast({
              title: "Successfully Connected",
              description: "Your TikTok Ads account has been connected successfully."
            });
          } else {
            throw new Error(result.error || 'Authentication failed');
          }
        } catch (error: any) {
          console.error('Error processing auth code from message:', error);
          showError(error.message || 'Authentication failed');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    console.log('Setting up message event listener');
    window.addEventListener('message', handleMessage);
    
    return () => {
      console.log('Removing message event listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [onConnectionStatusChange, toast]);
  
  // Check for saved tokens on component mount and location changes
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
  }, [platform, onConnectionStatusChange, location.pathname]);
  
  const fetchAdAccounts = async (accessToken: string) => {
    if (!accessToken) {
      console.error('Cannot fetch ad accounts without an access token');
      return;
    }
    
    try {
      console.log('Fetching ad accounts with token:', accessToken.substring(0, 5) + '...');
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
        
        // If we have accounts but no selected account, select the first one
        if (formattedAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(formattedAccounts[0].id);
        }
      } else {
        console.log('No accounts found or API error, using mock data');
        // If API call succeeded but no accounts found, use mock data
        setAccounts([
          { id: '1', name: 'Ace Labs Main', budget: 5000, status: 'Active' },
          { id: '2', name: 'Ace Labs Test', budget: 1000, status: 'Paused' },
        ]);
        
        // Select the first mock account
        setSelectedAccount('1');
      }
    } catch (error: any) {
      console.error('Error fetching ad accounts:', error);
      // Fallback to mock data on error
      setAccounts([
        { id: '1', name: 'Ace Labs Main', budget: 5000, status: 'Active' },
        { id: '2', name: 'Ace Labs Test', budget: 1000, status: 'Paused' },
      ]);
      
      // Select the first mock account
      setSelectedAccount('1');
      
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
      console.log('Retrieved auth URL:', authUrl);
      setAuthUrl(authUrl);
      setAuthSheetOpen(true);
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

  const closeAuthSheet = () => {
    console.log('Closing auth sheet');
    setAuthSheetOpen(false);
    setAuthUrl(null);
  };
  
  return (
    <ErrorBoundary>
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
                  className={`cursor-pointer transition-all ${selectedAccount === account.id ? 'ring-2 ring-primary' : ''}`}
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
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                size="sm"
              >
                {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
              <Button disabled={!selectedAccount}>Continue with Selected Account</Button>
            </div>
            
            {showDebugInfo && (
              <div className="mt-4 p-4 bg-muted/50 rounded-md overflow-x-auto">
                <h4 className="font-medium mb-2">Local Storage Token Status</h4>
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(getSavedTikTokToken(), null, 2)}
                </pre>
                {debugInfo && (
                  <>
                    <h4 className="font-medium mt-4 mb-2">Last Authentication Result</h4>
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(debugInfo, (key, value) => {
                        if (key === 'token') return '[REDACTED]';
                        return value;
                      }, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        {!isConnected && !isLoading && !isProcessingAuth && (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed">
            <div className="mb-4 p-3 rounded-full bg-secondary">
              <Link className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connect Your TikTok Account</h3>
            <p className="text-center text-muted-foreground mb-4 max-w-md">
              Connect your TikTok Ads account to manage campaigns directly from the Ace Labs platform
            </p>
            <Button onClick={initiateConnect}>Connect TikTok Ads</Button>
          </div>
        )}
      </div>
      
      {/* TikTok Auth Sheet with iframe - keeps users within our app */}
      <Sheet 
        open={authSheetOpen} 
        onOpenChange={(open) => {
          if (!open) closeAuthSheet();
          else setAuthSheetOpen(true);
        }}
      >
        <SheetContent 
          className="w-full md:max-w-md overflow-hidden flex flex-col p-0" 
          onInteractOutside={(e) => {
            // Prevent closing when interacting with iframe
            if (isLoading) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with ESC when loading
            if (isLoading) e.preventDefault();
          }}
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Connect to TikTok Ads</SheetTitle>
              <Button variant="ghost" size="icon" onClick={closeAuthSheet} disabled={isLoading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription>
              Please complete the TikTok authentication below. Do not close this window until authentication is complete.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            {authUrl && (
              <iframe 
                ref={iframeRef}
                src={authUrl}
                className="w-full h-full min-h-[70vh] border-none"
                title="TikTok Authentication"
                onLoad={() => console.log('TikTok auth iframe loaded')}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
      
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
    </ErrorBoundary>
  );
};

export default AdAccountSelector;

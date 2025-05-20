
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Link, Loader2, X, Facebook } from "lucide-react";
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
  saveMetaToken,
  hasMetaToken,
  getSavedMetaToken,
  removeMetaToken,
  getMetaAdAccounts,
  getMetaOAuthUrl,
  processMetaAuthCallback
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
  const [metaTokenInput, setMetaTokenInput] = useState('');
  const [metaTokenDialogOpen, setMetaTokenDialogOpen] = useState(false);
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Setup message listener for auth iframe
  useEffect(() => {
    if (platform === 'tiktok') {
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
    }
  }, [platform, onConnectionStatusChange, toast]);
  
  // Check for URL parameters on component mount and location changes
  useEffect(() => {
    const processAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (!code) return;
      
      console.log('Found auth code in URL:', code.substring(0, 5) + '...');
      
      // Determine platform from state param if available
      let authPlatform = platform;
      if (state) {
        try {
          const stateObj = JSON.parse(decodeURIComponent(state));
          if (stateObj.platform) {
            authPlatform = stateObj.platform;
          }
        } catch (e) {
          console.warn('Could not parse state parameter:', e);
        }
      }
      
      setIsLoading(true);
      
      try {
        if (authPlatform === 'tiktok') {
          // Process the TikTok authorization code
          const result = await processTikTokAuthCallback(
            `https://app-sandbox.acelabs.co.za/advertising?code=${code}`
          );
          
          if (result.success && result.token) {
            setIsConnected(true);
            if (onConnectionStatusChange) onConnectionStatusChange(true);
            await fetchAdAccounts(result.token);
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
        } else if (authPlatform === 'meta') {
          // Process the Meta authorization code
          const result = await processMetaAuthCallback(window.location.href);
          
          if (result.success && result.token) {
            setIsConnected(true);
            if (onConnectionStatusChange) onConnectionStatusChange(true);
            await fetchMetaAdAccounts(result.token);
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
        showError(error.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
        
        // Clean up the URL without reloading the page
        navigate('/advertising', { replace: true });
      }
    };
    
    processAuthCallback();
  }, [location.search, platform, onConnectionStatusChange, navigate, toast]);

  // Check for saved tokens on component mount and platform changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('Checking auth status for', platform);
      setIsLoading(true);
      
      try {
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
        } else if (platform === 'meta') {
          const hasToken = hasMetaToken();
          console.log('Has existing Meta token:', hasToken);
          
          if (hasToken) {
            setIsConnected(true);
            if (onConnectionStatusChange) onConnectionStatusChange(true);
            
            const { accessToken, accountId } = getSavedMetaToken();
            
            if (accessToken) {
              console.log('Using existing Meta token to fetch ad accounts');
              await fetchMetaAdAccounts(accessToken);
              
              if (accountId) {
                console.log('Setting selected account from saved Meta token:', accountId);
                setSelectedAccount(accountId);
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

  const fetchMetaAdAccounts = async (accessToken: string) => {
    if (!accessToken) {
      console.error('Cannot fetch Meta ad accounts without an access token');
      return;
    }
    
    try {
      console.log('Fetching Meta ad accounts with token:', accessToken.substring(0, 5) + '...');
      const accountsData = await getMetaAdAccounts(accessToken);
      
      if (accountsData && accountsData.data) {
        console.log('Successfully fetched Meta ad accounts:', accountsData.data.length);
        const formattedAccounts = accountsData.data.map(account => ({
          id: account.id,
          name: account.name,
          status: account.status || 'Active',
          budget: account.amount_spent || 5000
        }));
        
        setAccounts(formattedAccounts);
        
        // If we have accounts but no selected account, select the first one
        if (formattedAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(formattedAccounts[0].id);
        }
      } else {
        console.log('No Meta accounts found or API error, using mock data');
        // If API call failed or no accounts found, use mock data
        setAccounts([
          { id: '101', name: 'Ace Labs Facebook', budget: 7500, status: 'Active' },
          { id: '102', name: 'Ace Labs Instagram', budget: 3000, status: 'Active' },
        ]);
        
        // Select the first mock account
        setSelectedAccount('101');
      }
    } catch (error: any) {
      console.error('Error fetching Meta ad accounts:', error);
      // Fallback to mock data on error
      setAccounts([
        { id: '101', name: 'Ace Labs Facebook', budget: 7500, status: 'Active' },
        { id: '102', name: 'Ace Labs Instagram', budget: 3000, status: 'Active' },
      ]);
      
      // Select the first mock account
      setSelectedAccount('101');
      
      toast({
        title: "Error Fetching Meta Accounts",
        description: "Could not retrieve your Meta ad accounts. Using sample data instead.",
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
      if (platform === 'tiktok') {
        const { authUrl } = await getTikTokAuthUrl();
        console.log('Retrieved auth URL:', authUrl);
        setAuthUrl(authUrl);
        setAuthSheetOpen(true);
      } else if (platform === 'meta') {
        // For Meta, we'll support both OAuth flow and manual token input
        const metaAuthUrl = getMetaOAuthUrl();
        console.log('Opening Meta auth URL:', metaAuthUrl);
        
        // Open in same window, which will redirect back to our app
        window.location.href = metaAuthUrl;
      }
    } catch (error: any) {
      console.error(`Error initiating ${platform} connection:`, error);
      showError(error.message || `Error connecting to ${platform}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = () => {
    let success = false;
    
    if (platform === 'tiktok') {
      success = removeTikTokToken();
      console.log('TikTok token removal success:', success);
    } else if (platform === 'meta') {
      success = removeMetaToken();
      console.log('Meta token removal success:', success);
    }
    
    setIsConnected(false);
    if (onConnectionStatusChange) onConnectionStatusChange(false);
    setSelectedAccount(null);
    setAccounts([]);
    
    toast({
      title: "Disconnected",
      description: `Successfully disconnected from ${platform === 'tiktok' ? 'TikTok' : 'Meta'} Ads`
    });
  };

  const closeAuthSheet = () => {
    console.log('Closing auth sheet');
    setAuthSheetOpen(false);
    setAuthUrl(null);
  };

  const handleMetaTokenSubmit = async () => {
    if (!metaTokenInput.trim()) {
      showError('Please enter a valid Meta Marketing API token');
      return;
    }
    
    setIsLoading(true);
    try {
      // Save the token
      const success = saveMetaToken(metaTokenInput.trim());
      console.log('Meta token saved successfully:', success);
      
      if (success) {
        setIsConnected(true);
        if (onConnectionStatusChange) onConnectionStatusChange(true);
        
        // Fetch ad accounts with the new token
        await fetchMetaAdAccounts(metaTokenInput.trim());
        
        setMetaTokenDialogOpen(false);
        setMetaTokenInput('');
        
        toast({
          title: "Successfully Connected",
          description: "Your Meta Ads account has been connected successfully."
        });
      } else {
        throw new Error('Failed to save Meta token');
      }
    } catch (error: any) {
      console.error('Error saving Meta token:', error);
      showError(error.message || 'Failed to connect Meta Ads account');
    } finally {
      setIsLoading(false);
    }
  };

  // For advanced users who want to manually enter a token
  const showManualTokenInput = () => {
    setMetaTokenDialogOpen(true);
  };
  
  const renderPlatformHeader = () => {
    if (platform === 'tiktok') {
      return (
        <>
          <h3 className="text-lg font-medium mb-1">TikTok For Business</h3>
          <p className="text-sm text-muted-foreground">Connect your TikTok Ads account to create and manage campaigns</p>
        </>
      );
    } else {
      return (
        <>
          <h3 className="text-lg font-medium mb-1">Meta For Business</h3>
          <p className="text-sm text-muted-foreground">Connect your Facebook & Instagram Ads account to create and manage campaigns</p>
        </>
      );
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            {renderPlatformHeader()}
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
            <span className="ml-2">Processing {platform === 'tiktok' ? 'TikTok' : 'Meta'} connection...</span>
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
                      <a 
                        href={platform === 'tiktok' 
                          ? "https://ads.tiktok.com/business/" 
                          : "https://business.facebook.com/adsmanager/"
                        } 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Link className="h-4 w-4 mr-1" /> 
                        View in {platform === 'tiktok' ? 'TikTok' : 'Meta'} Ads Manager
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
                {platform === 'tiktok' ? (
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(getSavedTikTokToken(), null, 2)}
                  </pre>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(getSavedMetaToken(), null, 2)}
                  </pre>
                )}
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
              {platform === 'tiktok' ? (
                <Link className="h-6 w-6 text-primary" />
              ) : (
                <Facebook className="h-6 w-6 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">Connect Your {platform === 'tiktok' ? 'TikTok' : 'Meta'} Account</h3>
            <p className="text-center text-muted-foreground mb-4 max-w-md">
              Connect your {platform === 'tiktok' ? 'TikTok' : 'Meta'} Ads account to manage campaigns directly from the Ace Labs platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={initiateConnect}>
                Connect with {platform === 'tiktok' ? 'TikTok' : 'Facebook'}
              </Button>
              {platform === 'meta' && (
                <Button variant="outline" onClick={showManualTokenInput}>
                  Use API Token
                </Button>
              )}
            </div>
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
          size="large"
          className="w-full overflow-hidden flex flex-col p-0" 
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
      
      {/* Meta Token Input Dialog */}
      <Dialog open={metaTokenDialogOpen} onOpenChange={setMetaTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Meta Ads</DialogTitle>
            <DialogDescription>
              Enter your Meta Marketing API token to connect your Facebook & Instagram ads accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metaToken">Meta Marketing API Token</Label>
              <Input
                id="metaToken"
                placeholder="Enter your Meta Marketing API token"
                value={metaTokenInput}
                onChange={(e) => setMetaTokenInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find your token in the Meta for Developers dashboard.
              </p>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMetaTokenDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleMetaTokenSubmit}
              disabled={!metaTokenInput.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage || `There was an error connecting to ${platform === 'tiktok' ? 'TikTok' : 'Meta'} Ads.`}
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

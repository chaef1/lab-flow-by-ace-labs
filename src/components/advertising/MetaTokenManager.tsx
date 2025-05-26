
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { updateMetaToken, testMetaApiConnection } from '@/utils/meta-token-updater';
import { getSavedMetaToken, hasMetaToken } from '@/lib/storage/token-storage';

const MetaTokenManager = () => {
  const [newToken, setNewToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [currentTokenInfo, setCurrentTokenInfo] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    checkCurrentToken();
  }, []);

  const checkCurrentToken = async () => {
    const isConnected = hasMetaToken();
    if (isConnected) {
      const { accessToken, accountId } = getSavedMetaToken();
      setCurrentTokenInfo({
        hasToken: true,
        tokenPreview: accessToken?.substring(0, 15) + '...',
        accountId: accountId || 'Not set'
      });
      
      // Test current connection
      testCurrentConnection();
    } else {
      setCurrentTokenInfo({ hasToken: false });
    }
  };

  const testCurrentConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testMetaApiConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a Meta Marketing API token",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateMetaToken(newToken.trim());
      
      if (result.success) {
        toast({
          title: "Token Updated",
          description: result.message,
        });
        setNewToken('');
        checkCurrentToken(); // Refresh current token info
      } else {
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update token",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const quickUpdateWithProvidedToken = async () => {
    const providedToken = "EAAY3bx1LEn8BO2SHmucBdWc4ZAXN5jGuPFxNhvrOpFtErHzUMHe293XyxyCWzcFfceRiZC1hwLpm4eHx9jWd8cDYpeCBzR0wEBHW0uAJhfyPG95pZC1X5rRXeGv4ZB0n6mMhZAIWqlbDJWpqy9XnaZBZANGdxvXCY4Ndu9Flh6jFdknqWS1kXIimDyTVoQYEZAGiwsaC0ldI";
    setNewToken(providedToken);
    
    setIsUpdating(true);
    try {
      const result = await updateMetaToken(providedToken);
      
      if (result.success) {
        toast({
          title: "Token Updated",
          description: result.message,
        });
        setNewToken('');
        checkCurrentToken();
      } else {
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Update Error",
        description: error.message || "Failed to update token",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meta Marketing API Token Manager</CardTitle>
          <CardDescription>
            Update and test your Meta Marketing API token for advertising features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Token Status */}
          {currentTokenInfo && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium mb-2">Current Token Status</h3>
              {currentTokenInfo.hasToken ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Connected</Badge>
                    <span className="text-sm text-muted-foreground">
                      Token: {currentTokenInfo.tokenPreview}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Account ID:</span> {currentTokenInfo.accountId}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testCurrentConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Not Connected</Badge>
                  <span className="text-sm text-muted-foreground">No token found</span>
                </div>
              )}
            </div>
          )}

          {/* Connection Test Results */}
          {connectionStatus && (
            <Alert variant={connectionStatus.success ? "default" : "destructive"}>
              {connectionStatus.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {connectionStatus.success ? (
                  <div>
                    <strong>Connection Successful!</strong>
                    <br />
                    {connectionStatus.message}
                  </div>
                ) : (
                  <div>
                    <strong>Connection Failed:</strong>
                    <br />
                    {connectionStatus.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Update Button */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Quick Update</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Use the token you provided in the message
            </p>
            <Button 
              onClick={quickUpdateWithProvidedToken}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Update with Provided Token
            </Button>
          </div>

          {/* Manual Token Input */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Manual Token Update</h3>
            <div className="space-y-3">
              <Input
                placeholder="Enter Meta Marketing API token"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                type="password"
              />
              <Button 
                onClick={handleUpdateToken}
                disabled={isUpdating || !newToken.trim()}
                className="w-full"
              >
                {isUpdating && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Update Token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaTokenManager;

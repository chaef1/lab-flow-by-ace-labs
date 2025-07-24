
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
    const isConnected = await hasMetaToken();
    if (isConnected) {
      const { accessToken, accountId } = await getSavedMetaToken();
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

  // Removed hardcoded token for security - users must input their own tokens

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

          {/* Security Notice */}
          <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
            <h3 className="font-medium mb-2 text-yellow-800">Security Notice</h3>
            <p className="text-sm text-yellow-700">
              For security reasons, API tokens are not hardcoded. Please obtain your Meta Marketing API token from the Meta Developer Console and enter it manually below.
            </p>
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

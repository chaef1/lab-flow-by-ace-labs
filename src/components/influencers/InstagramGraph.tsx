
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Instagram, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { hasMetaToken } from "@/lib/ads-api";

export default function InstagramGraph() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const isMetaConnected = hasMetaToken();
  
  const handleConnectInstagram = async () => {
    // This would initiate the Instagram Graph API connection process
    // For a full implementation, you'd need to handle OAuth flow through Meta
    setIsConnecting(true);
    
    try {
      // Mock implementation for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Connected to Instagram",
        description: "You can now access Instagram insights and creator data",
      });
    } catch (error) {
      console.error("Error connecting to Instagram:", error);
      toast({
        title: "Connection failed",
        description: "Could not connect to Instagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  if (!isMetaConnected) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to connect your Meta account first to use Instagram API features.
          Please visit the Advertising page to connect your Meta account.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram Graph API</CardTitle>
        <CardDescription>
          Connect with Instagram Graph API to access influencer insights and data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Available Features</h3>
            <ul className="text-sm space-y-2">
              <li>• Access to influencer engagement metrics</li>
              <li>• View audience demographics</li>
              <li>• Analyze post performance</li>
              <li>• Track content reach and impressions</li>
            </ul>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleConnectInstagram} 
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Instagram className="mr-2 h-4 w-4" />
                Connect Instagram Graph API
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Connecting will allow access to Instagram data according to Meta's policies.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

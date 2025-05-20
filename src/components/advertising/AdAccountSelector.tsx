
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from "lucide-react";

interface AdAccountSelectorProps {
  platform: 'tiktok' | 'meta';
}

const AdAccountSelector: React.FC<AdAccountSelectorProps> = ({ platform }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  
  // Mock accounts for demo purposes
  const accounts = [
    { id: '1', name: 'Ace Labs Main', budget: 5000, status: 'Active' },
    { id: '2', name: 'Ace Labs Test', budget: 1000, status: 'Paused' },
  ];
  
  const handleConnect = () => {
    // In a real implementation, this would trigger the OAuth flow
    setTimeout(() => {
      setIsConnected(true);
    }, 1000);
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedAccount(null);
  };
  
  return (
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
            onCheckedChange={(checked) => checked ? handleConnect() : handleDisconnect()}
          />
        </div>
      </div>
      
      {isConnected ? (
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
                  <p className="text-2xl font-bold">${account.budget.toLocaleString()}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
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
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed">
          <div className="mb-4 p-3 rounded-full bg-secondary">
            <Link className="h-6 w-6 text-ace-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Connect Your TikTok Account</h3>
          <p className="text-center text-muted-foreground mb-4 max-w-md">
            Connect your TikTok Ads account to manage campaigns directly from the Ace Labs platform
          </p>
          <Button onClick={handleConnect}>Connect TikTok Ads</Button>
        </div>
      )}
    </div>
  );
};

export default AdAccountSelector;

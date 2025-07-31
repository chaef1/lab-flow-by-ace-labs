import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Unlink, ExternalLink } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

interface ConnectedProfile {
  platform: string;
  username: string;
  profileKey: string;
  status: string;
}

interface PlatformCardProps {
  platform: Platform;
  connectedProfile?: ConnectedProfile;
  onConnect: (platformId: string) => void;
  onDisconnect: (profileKey: string, platform: string) => void;
  isConnecting: boolean;
}

export function PlatformCard({ 
  platform, 
  connectedProfile, 
  onConnect, 
  onDisconnect,
  isConnecting 
}: PlatformCardProps) {
  const Icon = platform.icon;
  const isConnected = !!connectedProfile && connectedProfile.status === 'active';

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${platform.gradient}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{platform.name}</h3>
              {connectedProfile && (
                <p className="text-sm text-muted-foreground">
                  @{connectedProfile.username}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDisconnect(connectedProfile.profileKey, platform.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
                <Button
                  onClick={() => onConnect(platform.id)}
                  disabled={isConnecting}
                  className={`bg-gradient-to-r ${platform.gradient} text-white border-0 hover:opacity-90`}
                >
                  {isConnecting ? (
                    'Connecting...'
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="text-sm text-muted-foreground">
            Last synced: Just now
          </div>
        )}
      </CardContent>
    </Card>
  );
}
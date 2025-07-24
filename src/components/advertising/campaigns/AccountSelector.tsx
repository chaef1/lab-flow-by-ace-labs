
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader, Building2, CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMetaUserPermissions, getSavedMetaToken } from '@/lib/api/meta-api';
import { useToast } from "@/hooks/use-toast";

interface AccountSelectorProps {
  onAccountSelected: (account: any) => void;
  selectedAccountId?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  onAccountSelected,
  selectedAccountId
}) => {
  const [permissions, setPermissions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { accessToken } = await getSavedMetaToken();
      
      if (!accessToken) {
        throw new Error('No Meta access token found');
      }

      console.log('Fetching Meta user permissions...');
      const permissionsData = await getMetaUserPermissions(accessToken);
      
      if (permissionsData) {
        console.log('Meta permissions fetched:', permissionsData);
        setPermissions(permissionsData);
        
        // Auto-select first ad account if none selected
        if (permissionsData.adAccounts?.data?.length > 0 && !selectedAccountId) {
          onAccountSelected(permissionsData.adAccounts.data[0]);
        }
      } else {
        console.warn('No permissions data received');
        setPermissions(null);
      }
    } catch (error: any) {
      console.error('Error fetching Meta permissions:', error);
      setError(error.message || 'Failed to fetch account permissions');
      
      toast({
        title: "Error Loading Accounts",
        description: error.message || "Failed to fetch Meta account permissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelection = (accountId: string) => {
    const selectedAccount = permissions?.adAccounts?.data?.find((account: any) => account.id === accountId);
    if (selectedAccount) {
      console.log('Ad account selected:', selectedAccount);
      onAccountSelected(selectedAccount);
    }
  };

  const getSelectedAccount = () => {
    return permissions?.adAccounts?.data?.find((account: any) => account.id === selectedAccountId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Select Ad Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-2">
              <Loader className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading accounts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Select Ad Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Select Ad Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        {permissions?.user && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {permissions.user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-blue-900">{permissions.user.name}</p>
                <p className="text-sm text-blue-700">{permissions.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Business Managers */}
        {permissions?.businesses?.data?.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Business Managers</label>
            <div className="space-y-1">
              {permissions.businesses.data.map((business: any) => (
                <div key={business.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>{business.name}</span>
                  {business.verification_status && (
                    <Badge variant="secondary" className="text-xs">
                      {business.verification_status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ad Account Selection */}
        {permissions?.adAccounts?.data?.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No ad accounts found. Make sure you have access to at least one Meta ad account.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Choose Ad Account for Campaign
              </label>
              <Select 
                value={selectedAccountId || ''} 
                onValueChange={handleAccountSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an ad account" />
                </SelectTrigger>
                <SelectContent>
                  {permissions?.adAccounts?.data?.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>{account.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {account.currency}
                        </Badge>
                        {account.account_status && (
                          <Badge 
                            variant={account.account_status === 'ACTIVE' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {account.account_status}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {getSelectedAccount() && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{getSelectedAccount()?.name}</p>
                    <p className="text-sm text-green-700">
                      Account ID: {getSelectedAccount()?.id}
                    </p>
                    <p className="text-sm text-green-700">
                      Currency: {getSelectedAccount()?.currency} | Status: {getSelectedAccount()?.account_status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>
                Your campaign will be created in the selected ad account. 
                Make sure you have the necessary permissions to create campaigns in this account.
              </p>
            </div>
          </>
        )}

        {/* Pages Summary */}
        {permissions?.pages?.data?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p>✓ {permissions.pages.data.length} Facebook Page(s) available for ad creation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountSelector;

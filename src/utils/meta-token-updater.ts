
import { saveMetaToken, getSavedMetaToken, hasMetaToken } from '@/lib/storage/token-storage';
import { getMetaAdAccounts } from '@/lib/api/meta-api';
import { useToast } from '@/components/ui/use-toast';

export const updateMetaToken = async (newToken: string) => {
  console.log('Updating Meta token:', newToken.substring(0, 10) + '...');
  
  try {
    // First, test the token by trying to get ad accounts
    const accountsData = await getMetaAdAccounts(newToken);
    
    if (accountsData && accountsData.data && accountsData.data.length > 0) {
      const firstAccountId = accountsData.data[0].id;
      console.log('Token validated successfully. First account ID:', firstAccountId);
      
      // Save the token with the first available account ID
      const saved = await saveMetaToken(newToken, firstAccountId);
      
      if (saved) {
        console.log('Meta token updated and saved successfully');
        return {
          success: true,
          accountId: firstAccountId,
          accountsCount: accountsData.data.length,
          message: `Token updated successfully. Found ${accountsData.data.length} ad accounts.`
        };
      } else {
        throw new Error('Failed to save token to storage');
      }
    } else {
      throw new Error('No ad accounts found or token is invalid');
    }
  } catch (error) {
    console.error('Error updating Meta token:', error);
    return {
      success: false,
      error: error.message || 'Failed to update token'
    };
  }
};

export const testMetaApiConnection = async () => {
  const { accessToken, accountId } = await getSavedMetaToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: 'No Meta token found in storage'
    };
  }
  
  try {
    console.log('Testing Meta API connection...');
    
    // Test 1: Get ad accounts
    const accountsData = await getMetaAdAccounts(accessToken);
    console.log('Ad accounts test result:', accountsData);
    
    if (!accountsData || !accountsData.data) {
      throw new Error('Failed to fetch ad accounts');
    }
    
    return {
      success: true,
      accountsCount: accountsData.data.length,
      currentAccountId: accountId,
      message: `API connection successful. ${accountsData.data.length} ad accounts accessible.`
    };
  } catch (error) {
    console.error('Meta API connection test failed:', error);
    return {
      success: false,
      error: error.message || 'API connection test failed'
    };
  }
};

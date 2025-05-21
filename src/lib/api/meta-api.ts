
import { supabase } from "@/integrations/supabase/client";
import { saveMetaToken, hasMetaToken, getSavedMetaToken, removeMetaToken } from "@/lib/storage/token-storage";

/**
 * Helper functions for interacting with the Meta Ads API
 */

// Get Meta OAuth URL for user login
export const getMetaOAuthUrl = () => {
  // Use the dedicated Facebook Ads app ID for advertising
  const appId = "1749800232620671";
  const redirectUri = encodeURIComponent(window.location.origin + "/advertising");
  const state = encodeURIComponent(JSON.stringify({ platform: 'meta', timestamp: Date.now() }));
  const scope = encodeURIComponent("ads_management,ads_read,business_management");
  
  return `https://www.facebook.com/v17.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_type=code`;
};

// Exchange Meta authorization code for an access token
export const exchangeMetaCode = async (code: string) => {
  try {
    console.log('Exchanging Meta code:', code);
    
    const redirectUri = window.location.origin + "/advertising";
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        code, 
        redirectUri, 
        action: 'exchange_code' 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    console.log('Meta exchange code response:', data);
    return data;
  } catch (err) {
    console.error('Error exchanging Meta code:', err);
    throw err;
  }
};

// Process Meta OAuth callback
export const processMetaAuthCallback = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const stateStr = urlObj.searchParams.get('state');
    
    if (!code) {
      throw new Error('No authorization code found in URL');
    }
    
    let state = {};
    try {
      if (stateStr) {
        state = JSON.parse(decodeURIComponent(stateStr));
      }
    } catch (e) {
      console.warn('Could not parse state parameter:', e);
    }
    
    console.log('Processing Meta auth callback with code:', code.substring(0, 5) + '...');
    
    // Exchange the code for an access token
    const tokenData = await exchangeMetaCode(code);
    
    if (tokenData && tokenData.access_token) {
      const accessToken = tokenData.access_token;
      
      // Save the token
      const saved = saveMetaToken(accessToken);
      console.log('Meta token saved successfully:', saved);
      
      // Get ad accounts to get the first available account ID
      const accountsData = await getMetaAdAccounts(accessToken);
      let accountId = '';
      
      if (accountsData && accountsData.data && accountsData.data.length > 0) {
        accountId = accountsData.data[0].id;
        // Update saved token with account ID
        saveMetaToken(accessToken, accountId);
      }
      
      return {
        success: true,
        token: accessToken,
        accountId,
        tokenData
      };
    } else {
      throw new Error('Failed to authenticate with Meta');
    }
  } catch (error) {
    console.error('Error processing Meta auth callback:', error);
    return { success: false, error: error.message };
  }
};

// Get Meta ad accounts using our edge function
export const getMetaAdAccounts = async (accessToken: string) => {
  try {
    console.log('Getting Meta ad accounts with token:', accessToken.substring(0, 5) + '...');
    
    // Use our new edge function to call the Meta API securely
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        action: 'get_ad_accounts' 
      }
    });
    
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error getting Meta ad accounts:', err);
    throw err;
  }
};

// Get Meta campaigns using our edge function
export const getMetaCampaigns = async (accessToken: string, accountId: string) => {
  try {
    console.log('Getting Meta campaigns for account:', accountId);
    
    // Use our new edge function to call the Meta API securely
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        action: 'get_campaigns' 
      }
    });
    
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error getting Meta campaigns:', err);
    throw err;
  }
};

// Create a new Meta campaign
export const createMetaCampaign = async (accessToken: string, accountId: string, campaignData: any) => {
  try {
    console.log('Creating Meta campaign for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken,
        accountId, 
        campaignData,
        action: 'create_campaign' 
      }
    });
    
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating Meta campaign:', err);
    throw err;
  }
};

// Get Meta ad audiences
export const getMetaAudiences = async (accessToken: string, accountId: string) => {
  try {
    console.log('Getting Meta audiences for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        action: 'get_audiences' 
      }
    });
    
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error getting Meta audiences:', err);
    throw err;
  }
};

// Upload creative asset to Meta ad account
export const uploadMetaCreative = async (accessToken: string, accountId: string, fileData: any) => {
  try {
    console.log('Uploading creative to Meta for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        fileData,
        action: 'upload_creative' 
      }
    });
    
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error uploading creative to Meta:', err);
    throw err;
  }
};

// Export token storage functions directly
export { saveMetaToken, hasMetaToken, getSavedMetaToken, removeMetaToken };

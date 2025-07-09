import { supabase } from "@/integrations/supabase/client";
import { saveMetaToken, hasMetaToken, getSavedMetaToken, removeMetaToken } from "@/lib/storage/token-storage";

/**
 * Helper functions for interacting with the Meta Ads API
 */

// Get Meta OAuth URL for user login
export const getMetaOAuthUrl = () => {
  // Use the dedicated Facebook Ads app ID for advertising
  const appId = "1749800232620671";
  
  // Determine the appropriate redirect URI based on the current domain
  let redirectUri = window.location.origin + "/advertising";
  
  // Check if we're on the sandbox domain and use it instead
  if (window.location.hostname === 'app-sandbox.acelabs.co.za') {
    redirectUri = 'https://app-sandbox.acelabs.co.za/advertising';
  }
  
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const state = encodeURIComponent(JSON.stringify({ platform: 'meta', timestamp: Date.now() }));
  const scope = encodeURIComponent("ads_management,ads_read,business_management,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_insights,pages_show_list,instagram_content_publish");
  
  console.log('Generating Meta OAuth URL with redirect URI:', redirectUri);
  
  // Use the Graph API OAuth endpoint for consistency
  return `https://graph.facebook.com/v17.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodedRedirectUri}&state=${state}&scope=${scope}&response_type=code&auth_type=rerequest`;
};

// Exchange Meta authorization code for an access token
export const exchangeMetaCode = async (code: string) => {
  try {
    console.log('Exchanging Meta code:', code);
    
    // Determine the appropriate redirect URI based on the current domain
    let redirectUri = window.location.origin + "/advertising";
    
    // Check if we're on the sandbox domain and use it instead
    if (window.location.hostname === 'app-sandbox.acelabs.co.za') {
      redirectUri = 'https://app-sandbox.acelabs.co.za/advertising';
    }
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        code, 
        redirectUri, 
        action: 'exchange_code' 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Error exchanging code');
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
    const error = urlObj.searchParams.get('error');
    const errorDescription = urlObj.searchParams.get('error_description');
    
    if (error) {
      throw new Error(`Authentication error: ${errorDescription || error}`);
    }
    
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
    return { success: false, error: error.message || 'Authentication failed' };
  }
};

// Get Meta pages (Facebook Pages and Instagram accounts)
export const getMetaPages = async (accessToken: string) => {
  try {
    console.log('Getting Meta pages with token:', accessToken.substring(0, 5) + '...');
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        action: 'get_pages' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error getting pages');
    return data;
  } catch (err) {
    console.error('Error getting Meta pages:', err);
    throw err;
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
    
    if (error) throw new Error(error.message || 'Error getting ad accounts');
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
    
    if (error) throw new Error(error.message || 'Error getting campaigns');
    return data;
  } catch (err) {
    console.error('Error getting Meta campaigns:', err);
    throw err;
  }
};

// Create a new Meta campaign
export const createMetaCampaign = async (accessToken: string, accountId: string, campaignData: any) => {
  try {
    console.log('Creating Meta campaign for account:', accountId, 'with data:', campaignData);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken,
        accountId, 
        campaignData,
        action: 'create_campaign' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error creating campaign');
    return data;
  } catch (err) {
    console.error('Error creating Meta campaign:', err);
    throw err;
  }
};

// Update Meta campaign status (new function)
export const updateMetaCampaignStatus = async (accessToken: string, accountId: string, campaignId: string, status: string) => {
  try {
    console.log(`Updating Meta campaign ${campaignId} status to ${status}`);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken,
        accountId,
        campaignId,
        status,
        action: 'update_campaign_status' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error updating campaign status');
    return data;
  } catch (err) {
    console.error('Error updating Meta campaign status:', err);
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
    
    if (error) throw new Error(error.message || 'Error getting audiences');
    return data;
  } catch (err) {
    console.error('Error getting Meta audiences:', err);
    throw err;
  }
};

// Create Ad Set with targeting options
export const createMetaAdSet = async (accessToken: string, accountId: string, adSetData: any) => {
  try {
    console.log('Creating Meta ad set for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        adSetData,
        action: 'create_ad_set' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error creating ad set');
    return data;
  } catch (err) {
    console.error('Error creating Meta ad set:', err);
    throw err;
  }
};

// Create Ad with creative
export const createMetaAd = async (accessToken: string, accountId: string, adData: any) => {
  try {
    console.log('Creating Meta ad for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        adData,
        action: 'create_ad' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error creating ad');
    return data;
  } catch (err) {
    console.error('Error creating Meta ad:', err);
    throw err;
  }
};

// Upload creative asset to Meta ad account
export const uploadMetaCreative = async (accessToken: string, accountId: string, creativeData: any) => {
  try {
    console.log('Uploading creative to Meta for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        creativeData,
        action: 'upload_creative' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error uploading creative');
    return data;
  } catch (err) {
    console.error('Error uploading creative to Meta:', err);
    throw err;
  }
};

// Create ad creative with uploaded assets
export const createMetaAdCreative = async (accessToken: string, accountId: string, adCreativeData: any) => {
  try {
    console.log('Creating Meta ad creative for account:', accountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        accountId, 
        adCreativeData,
        action: 'create_ad_creative' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error creating ad creative');
    return data;
  } catch (err) {
    console.error('Error creating Meta ad creative:', err);
    throw err;
  }
};

// Get user permissions and all accessible accounts/assets
export const getMetaUserPermissions = async (accessToken: string) => {
  try {
    console.log('Getting Meta user permissions with token:', accessToken.substring(0, 5) + '...');
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        accessToken, 
        action: 'get_user_permissions' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error getting user permissions');
    return data;
  } catch (err) {
    console.error('Error getting Meta user permissions:', err);
    throw err;
  }
};

// Force refresh Meta token status and trigger listeners
export const refreshMetaTokenStatus = () => {
  const { accessToken } = getSavedMetaToken();
  console.log('Force refreshing Meta token status, token exists:', !!accessToken);
  
  // Dispatch event to notify listeners of potential token change
  window.dispatchEvent(new Event('meta_auth_changed'));
  
  return !!accessToken;
};

// Subscribe to Instagram webhooks
export const subscribeInstagramWebhook = async (instagramAccountId: string, fields: string[]) => {
  try {
    console.log('Subscribing to Instagram webhooks for account:', instagramAccountId, 'fields:', fields);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        instagramAccountId, 
        fields,
        action: 'subscribe_instagram_webhook' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error subscribing to Instagram webhooks');
    return data;
  } catch (err) {
    console.error('Error subscribing to Instagram webhooks:', err);
    throw err;
  }
};

// Get Instagram webhook subscriptions
export const getInstagramSubscriptions = async (instagramAccountId: string) => {
  try {
    console.log('Getting Instagram webhook subscriptions for account:', instagramAccountId);
    
    const { data, error } = await supabase.functions.invoke('meta-auth', {
      body: { 
        instagramAccountId,
        action: 'get_instagram_subscriptions' 
      }
    });
    
    if (error) throw new Error(error.message || 'Error getting Instagram subscriptions');
    return data;
  } catch (err) {
    console.error('Error getting Instagram subscriptions:', err);
    throw err;
  }
};

// Export token storage functions directly
export { saveMetaToken, hasMetaToken, getSavedMetaToken, removeMetaToken };

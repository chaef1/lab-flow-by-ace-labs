
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper functions for interacting with the TikTok Ads API through our Supabase Edge Function
 */

// Get the OAuth URL for TikTok sign-in
export const getTikTokAuthUrl = async () => {
  try {
    // Using the hardcoded URL as specified
    const authUrl = "https://business-api.tiktok.com/portal/auth?app_id=7368672185281413136&state=your_custom_params&redirect_uri=https%3A%2F%2Fapp-sandbox.acelabs.co.za%2Fadvertising";
    console.log('Returning TikTok auth URL:', authUrl);
    return { authUrl };
  } catch (err) {
    console.error('Error getting TikTok auth URL:', err);
    throw err;
  }
};

// Exchange the OAuth code for an access token
export const exchangeTikTokCode = async (code: string) => {
  try {
    console.log('Exchanging TikTok code:', code);
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { code, action: 'exchange_code' }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    console.log('Exchange code response:', data);
    return data;
  } catch (err) {
    console.error('Error exchanging TikTok code:', err);
    throw err;
  }
};

// Get ad accounts for the authenticated user
export const getTikTokAdAccounts = async (accessToken: string) => {
  try {
    console.log('Getting TikTok ad accounts with token:', accessToken.substring(0, 5) + '...');
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { accessToken, action: 'get_ad_accounts' }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error getting TikTok ad accounts:', err);
    throw err;
  }
};

// Get campaigns for an ad account
export const getTikTokCampaigns = async (accessToken: string, advertiserId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { accessToken, advertiserId, action: 'get_campaigns' }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error getting TikTok campaigns:', err);
    throw err;
  }
};

// Token Handling Functions

// Save TikTok access token to localStorage with expiration handling
export const saveTikTokToken = (token: string, advertiserId: string) => {
  try {
    // Current timestamp plus 24 hours (in milliseconds)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    
    const tokenData = {
      token,
      advertiserId,
      expiresAt,
      lastUsed: Date.now()
    };
    
    console.log('Saving TikTok token data:', { 
      tokenPreview: token.substring(0, 5) + '...', 
      advertiserId, 
      expiresAt,
      lastUsed: new Date().toISOString()
    });
    
    localStorage.setItem('tiktok_auth', JSON.stringify(tokenData));
    return true;
  } catch (error) {
    console.error('Error saving TikTok token:', error);
    return false;
  }
};

// Get saved TikTok access token
export const getSavedTikTokToken = () => {
  try {
    const tokenDataStr = localStorage.getItem('tiktok_auth');
    console.log('Retrieved token data string:', tokenDataStr ? 'exists' : 'null');
    
    if (!tokenDataStr) {
      return { accessToken: null, advertiserId: null };
    }
    
    const tokenData = JSON.parse(tokenDataStr);
    
    // Handle malformed token data
    if (!tokenData || typeof tokenData !== 'object') {
      console.error('Malformed token data in localStorage');
      localStorage.removeItem('tiktok_auth');
      return { accessToken: null, advertiserId: null };
    }
    
    console.log('Parsed token data:', { 
      hasToken: !!tokenData.token, 
      hasAdvertiserId: !!tokenData.advertiserId,
      expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).toISOString() : 'not set',
      isExpired: tokenData.expiresAt && tokenData.expiresAt < Date.now()
    });
    
    // Check if token has expired
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      // Token expired, remove it
      console.log('Token expired, removing');
      removeTikTokToken();
      return { accessToken: null, advertiserId: null };
    }
    
    // Update the last used timestamp
    if (tokenData.token) {
      tokenData.lastUsed = Date.now();
      localStorage.setItem('tiktok_auth', JSON.stringify(tokenData));
    }
    
    return { 
      accessToken: tokenData.token,
      advertiserId: tokenData.advertiserId
    };
  } catch (err) {
    console.error('Error parsing TikTok token data:', err);
    return { accessToken: null, advertiserId: null };
  }
};

// Check if the TikTok token is saved and valid
export const hasTikTokToken = () => {
  const { accessToken } = getSavedTikTokToken();
  return !!accessToken;
};

// Remove TikTok token from storage
export const removeTikTokToken = () => {
  try {
    localStorage.removeItem('tiktok_auth');
    console.log('TikTok token removed from storage');
    return true;
  } catch (error) {
    console.error('Error removing TikTok token:', error);
    return false;
  }
};

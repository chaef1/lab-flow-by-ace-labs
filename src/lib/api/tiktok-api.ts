import { supabase } from "@/integrations/supabase/client";
import { saveTikTokToken, hasTikTokToken, getSavedTikTokToken, removeTikTokToken } from "@/lib/storage/token-storage";

/**
 * Helper functions for interacting with the TikTok Ads API through our Supabase Edge Function
 */

// Get the OAuth URL for TikTok sign-in
export const getTikTokAuthUrl = async () => {
  try {
    // Call our edge function to get the auth URL
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { action: 'get_auth_url' }
    });

    if (error) {
      console.error('Error getting TikTok auth URL:', error);
      throw error;
    }
    
    console.log('Returning TikTok auth URL:', data.authUrl);
    return { authUrl: data.authUrl };
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

// Process TikTok auth callback with code
export const processTikTokAuthCallback = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    
    if (!code) {
      throw new Error('No authorization code found in URL');
    }
    
    console.log('Processing TikTok auth callback with code:', code);
    
    // Exchange the code for a token
    const tokenData = await exchangeTikTokCode(code);
    
    console.log('Token exchange result:', tokenData);
    
    if (tokenData.code === 0 && tokenData.data && tokenData.data.access_token) {
      // Extract token and advertiser ID
      const token = tokenData.data.access_token;
      const advertiserId = tokenData.data.advertiser_ids?.[0] || '';
      
      // Save the token with extended expiration (7 days for testing)
      const saved = saveTikTokToken(token, advertiserId);
      console.log('Token saved successfully:', saved);
      
      return { 
        success: true, 
        token, 
        advertiserId,
        tokenData // Include the full token data for debugging
      };
    } else {
      throw new Error(tokenData.message || 'Failed to authenticate with TikTok');
    }
  } catch (error) {
    console.error('Error processing auth callback:', error);
    return { success: false, error: error.message };
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

// Create a new TikTok campaign
export const createTikTokCampaign = async (accessToken: string, advertiserId: string, campaignData: any) => {
  try {
    console.log('Creating TikTok campaign:', campaignData);
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { 
        accessToken, 
        advertiserId,
        campaignData,
        action: 'create_campaign' 
      }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating TikTok campaign:', err);
    throw err;
  }
};

// Export token storage functions directly for use in other modules
export { saveTikTokToken, hasTikTokToken, getSavedTikTokToken, removeTikTokToken };

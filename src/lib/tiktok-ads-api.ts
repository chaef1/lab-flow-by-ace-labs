
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper functions for interacting with the TikTok Ads API through our Supabase Edge Function
 */

// Get the OAuth URL for TikTok sign-in
export const getTikTokAuthUrl = async () => {
  // Use the custom redirect URI as specified
  const redirectUri = "https://app-sandbox.acelabs.co.za/advertising";
  
  try {
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { redirectUri, action: 'get_auth_url' }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error getting TikTok auth URL:', err);
    throw err;
  }
};

// Exchange the OAuth code for an access token
export const exchangeTikTokCode = async (code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('tiktok-ads', {
      body: { code, action: 'exchange_code' }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error exchanging TikTok code:', err);
    throw err;
  }
};

// Get ad accounts for the authenticated user
export const getTikTokAdAccounts = async (accessToken: string) => {
  try {
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
  // Current timestamp plus 24 hours (in milliseconds)
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
  
  const tokenData = {
    token,
    advertiserId,
    expiresAt
  };
  
  localStorage.setItem('tiktok_auth', JSON.stringify(tokenData));
};

// Get saved TikTok access token
export const getSavedTikTokToken = () => {
  const tokenDataStr = localStorage.getItem('tiktok_auth');
  
  if (!tokenDataStr) {
    return { accessToken: null, advertiserId: null };
  }
  
  try {
    const tokenData = JSON.parse(tokenDataStr);
    
    // Check if token has expired
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      // Token expired, remove it
      removeTikTokToken();
      return { accessToken: null, advertiserId: null };
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
  localStorage.removeItem('tiktok_auth');
};

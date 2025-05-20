
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper functions for interacting with the TikTok Ads API through our Supabase Edge Function
 */

// Get the OAuth URL for TikTok sign-in
export const getTikTokAuthUrl = async () => {
  // Use the current origin plus /advertising as the redirect URI
  const redirectUri = `${window.location.origin}/advertising`;
  
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

// Save TikTok access token to localStorage (in a real app, consider more secure storage)
export const saveTikTokToken = (token: string, advertiserId: string) => {
  localStorage.setItem('tiktok_access_token', token);
  localStorage.setItem('tiktok_advertiser_id', advertiserId);
};

// Get saved TikTok access token
export const getSavedTikTokToken = () => {
  return {
    accessToken: localStorage.getItem('tiktok_access_token'),
    advertiserId: localStorage.getItem('tiktok_advertiser_id')
  };
};

// Check if the TikTok token is saved
export const hasTikTokToken = () => {
  return !!localStorage.getItem('tiktok_access_token');
};

// Remove TikTok token from storage
export const removeTikTokToken = () => {
  localStorage.removeItem('tiktok_access_token');
  localStorage.removeItem('tiktok_advertiser_id');
};

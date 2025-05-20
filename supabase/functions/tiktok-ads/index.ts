
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// TikTok API configuration - using sandbox endpoint
const TIKTOK_API_URL = "https://sandbox-ads.tiktok.com/open_api";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get TikTok app credentials from environment variables
    const tiktokAppId = Deno.env.get('TIKTOK_APP_ID');
    const tiktokAppSecret = Deno.env.get('TIKTOK_APP_SECRET');

    if (!tiktokAppId || !tiktokAppSecret) {
      console.error('TikTok API credentials not found', {
        appIdExists: !!tiktokAppId,
        appSecretExists: !!tiktokAppSecret
      });
      return new Response(
        JSON.stringify({ error: 'TikTok API credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData = req.method === 'POST' ? await req.json() : {};
    const action = requestData.action || '';
    
    console.log(`Processing request with action: ${action}`, { requestData });

    // Use a switch statement to handle different API actions
    switch (action) {
      case 'get_auth_url':
        // Generate OAuth authorization URL for TikTok
        const redirectUri = requestData.redirectUri;
        const state = Math.random().toString(36).substring(2);
        
        if (!redirectUri) {
          return new Response(
            JSON.stringify({ error: 'Redirect URI is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        console.log('Generating auth URL with redirect URI:', redirectUri);
        
        // Use the sandbox auth endpoint
        const authUrl = `https://sandbox-ads.tiktok.com/marketing_api/auth?app_id=${tiktokAppId}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
        
        console.log('Generated auth URL:', authUrl);
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'exchange_code':
        // Exchange authorization code for access token
        const code = requestData.code;
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Authorization code is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Exchanging code for access token:', code);
        
        try {
          // Access Token Exchange Endpoint - using sandbox API
          const tokenResponse = await fetch(`${TIKTOK_API_URL}/oauth2/access_token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app_id: tiktokAppId,
              secret: tiktokAppSecret,
              auth_code: code,
              grant_type: 'authorization_code',
            }),
          });

          const tokenResult = await tokenResponse.json();
          console.log('Token exchange response:', tokenResult);
          
          if (!tokenResponse.ok) {
            console.error('Token exchange failed with status:', tokenResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to exchange token', 
                details: tokenResult,
                status: tokenResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: tokenResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(tokenResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to exchange code for token', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'get_ad_accounts':
        // Get advertising accounts for the authenticated user
        const accessToken = requestData.accessToken;
        if (!accessToken) {
          return new Response(
            JSON.stringify({ error: 'Access token is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching ad accounts with token:', accessToken.substring(0, 5) + '...');
        
        try {
          // Advertiser List Endpoint - using sandbox API
          const accountsResponse = await fetch(`${TIKTOK_API_URL}/advertiser/list/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Access-Token': accessToken,
            },
          });

          const accountsResult = await accountsResponse.json();
          console.log('Ad accounts response status:', accountsResponse.status);
          console.log('Ad accounts response code:', accountsResult.code);
          
          if (!accountsResponse.ok) {
            console.error('Ad accounts request failed with status:', accountsResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch ad accounts', 
                details: accountsResult,
                status: accountsResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: accountsResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(accountsResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching ad accounts:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch ad accounts', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'get_campaigns':
        // Get campaigns for a specific ad account
        const campaignToken = requestData.accessToken;
        const advertiser_id = requestData.advertiserId;
        
        if (!campaignToken || !advertiser_id) {
          return new Response(
            JSON.stringify({ error: 'Access token and advertiser ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching campaigns for advertiser:', advertiser_id);
        
        try {
          // Campaign List Endpoint - using sandbox API
          const campaignsResponse = await fetch(`${TIKTOK_API_URL}/campaign/get/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Access-Token': campaignToken,
            },
            body: JSON.stringify({
              advertiser_id: advertiser_id,
              page_size: 10,
              page: 1,
            }),
          });

          const campaignsResult = await campaignsResponse.json();
          console.log('Campaigns response status:', campaignsResponse.status);
          
          if (!campaignsResponse.ok) {
            console.error('Campaigns request failed with status:', campaignsResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch campaigns', 
                details: campaignsResult,
                status: campaignsResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: campaignsResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(campaignsResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching campaigns:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch campaigns', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action', requestedAction: action }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred', stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

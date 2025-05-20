
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// TikTok API configuration
const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3";

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
      console.error('TikTok API credentials not found');
      return new Response(
        JSON.stringify({ error: 'TikTok API credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request URL and body
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const data = req.method === 'POST' ? await req.json() : {};

    // Use a switch statement to handle different API actions
    switch (action) {
      case 'get_auth_url':
        // Generate OAuth authorization URL for TikTok
        const redirectUri = data.redirectUri || url.searchParams.get('redirectUri');
        const state = Math.random().toString(36).substring(2);
        
        const authUrl = `https://ads.tiktok.com/marketing_api/auth?app_id=${tiktokAppId}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'exchange_code':
        // Exchange authorization code for access token
        const code = data.code || url.searchParams.get('code');
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Authorization code is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

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

        const tokenData = await tokenResponse.json();
        return new Response(
          JSON.stringify(tokenData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_ad_accounts':
        // Get advertising accounts for the authenticated user
        const accessToken = data.accessToken || url.searchParams.get('accessToken');
        if (!accessToken) {
          return new Response(
            JSON.stringify({ error: 'Access token is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const accountsResponse = await fetch(`${TIKTOK_API_URL}/advertiser/list/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Access-Token': accessToken,
          },
        });

        const accountsData = await accountsResponse.json();
        return new Response(
          JSON.stringify(accountsData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_campaigns':
        // Get campaigns for a specific ad account
        const campaignToken = data.accessToken;
        const advertiser_id = data.advertiserId;
        
        if (!campaignToken || !advertiser_id) {
          return new Response(
            JSON.stringify({ error: 'Access token and advertiser ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const campaignsResponse = await fetch(`${TIKTOK_API_URL}/campaign/get/`, {
          method: 'GET',
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

        const campaignsData = await campaignsResponse.json();
        return new Response(
          JSON.stringify(campaignsData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Meta API configuration
const META_API_URL = "https://graph.facebook.com/v17.0";
const META_APP_ID = "1749800232620671";

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

    // Get Meta app credentials from environment variables
    const metaAppSecret = Deno.env.get('META_APP_SECRET');

    if (!META_APP_ID || !metaAppSecret) {
      console.error('Meta API credentials not found', {
        appIdExists: !!META_APP_ID,
        appSecretExists: !!metaAppSecret
      });
      return new Response(
        JSON.stringify({ error: 'Meta API credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body for API requests
    const requestData = req.method === 'POST' ? await req.json() : {};
    const action = requestData.action || '';
    
    console.log(`Processing request with action: ${action}`, { requestData });

    // Use a switch statement to handle different API actions
    switch (action) {
      case 'exchange_code':
        // Exchange authorization code for access token
        const code = requestData.code;
        const redirectUri = requestData.redirectUri;

        if (!code || !redirectUri) {
          return new Response(
            JSON.stringify({ error: 'Authorization code and redirect URI are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Exchanging code for access token:', code.substring(0, 5) + '...');
        
        try {
          // Access Token Exchange Endpoint
          const tokenUrl = `${META_API_URL}/oauth/access_token?client_id=${META_APP_ID}&client_secret=${metaAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
          
          const tokenResponse = await fetch(tokenUrl);
          const tokenResult = await tokenResponse.json();
          
          console.log('Token exchange response status:', tokenResponse.status);
          
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
          
          // Log the token data structure to help with debugging (hiding sensitive data)
          console.log('Token exchange successful, data structure:', 
            JSON.stringify(tokenResult, (key, value) => {
              if (key === 'access_token') return '[REDACTED]';
              return value;
            }, 2)
          );
          
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
          // Ad Accounts Endpoint
          const accountsResponse = await fetch(`${META_API_URL}/me/adaccounts?fields=name,account_id,account_status,amount_spent&access_token=${accessToken}`);
          const accountsResult = await accountsResponse.json();
          
          console.log('Ad accounts response status:', accountsResponse.status);
          
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
        const accountId = requestData.accountId;
        
        if (!campaignToken || !accountId) {
          return new Response(
            JSON.stringify({ error: 'Access token and account ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching campaigns for account:', accountId);
        
        try {
          // Campaign List Endpoint
          const campaignsResponse = await fetch(`${META_API_URL}/${accountId}/campaigns?fields=name,status,objective,spend&access_token=${campaignToken}`);
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

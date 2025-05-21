
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// TikTok API configuration - same URL for both production and sandbox
const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api";

// HTML template for auth success - this runs in the iframe inside our app
const authSuccessTemplate = (code) => `
<!DOCTYPE html>
<html>
<head>
  <title>TikTok Authentication</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 20px; background: #f8f9fa; }
    .success-icon { font-size: 48px; color: #00c16e; margin: 20px 0; }
    .message { margin: 20px 0; color: #333; }
  </style>
</head>
<body>
  <div class="success-icon">✓</div>
  <h1>Authentication Successful</h1>
  <p class="message">You've successfully authenticated with TikTok.</p>
  
  <script>
    // Send the code back to parent window
    const code = "${code}";
    
    // First try to send a message to the parent window 
    try {
      console.log("Sending authentication code to parent:", code);
      window.parent.postMessage({ tiktokAuthCode: code }, "*");
    } catch(err) {
      console.error("Error sending message to parent:", err);
    }
    
    // For direct navigation case
    if (!window.parent || window.parent === window) {
      try {
        localStorage.setItem('tiktok_auth_code', code);
        window.location.href = '/advertising';
        console.log("Redirecting to /advertising");
      } catch (err) {
        console.error("Error redirecting:", err);
      }
    }

    // Close the window automatically after sending the message (for popup case)
    setTimeout(function() {
      try {
        if (window.opener && !window.parent.closed) {
          window.close();
        }
      } catch (e) {
        console.log('Window cannot be closed automatically');
      }
    }, 2000);
  </script>
</body>
</html>
`;

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
        JSON.stringify({ error: 'TikTok API credentials not configured properly. Make sure both TIKTOK_APP_ID and TIKTOK_APP_SECRET are set.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check if this is a redirect with code in URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (req.method === 'GET' && code) {
      console.log('Detected redirect with auth code, serving HTML template');
      return new Response(
        authSuccessTemplate(code),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Parse the request body for regular API requests
    const requestData = req.method === 'POST' ? await req.json() : {};
    const action = requestData.action || '';
    
    console.log(`Processing request with action: ${action}`, { requestData });

    // Use a switch statement to handle different API actions
    switch (action) {
      case 'get_auth_url':
        // Generate the auth URL dynamically 
        const currentHost = url.hostname;
        const isLocal = currentHost.includes('localhost');
        
        // Determine the correct redirect URI based on environment
        // For live environment, we'll use the public-facing URL
        const redirectUri = isLocal 
          ? encodeURIComponent(`http://localhost:3000/advertising`)
          : encodeURIComponent(`https://app-sandbox.acelabs.co.za/advertising`);
        
        // Using the production auth URL for TikTok Business API
        const authUrl = `https://business-api.tiktok.com/portal/auth?app_id=${tiktokAppId}&state=production_mode&redirect_uri=${redirectUri}`;
        
        console.log('Generated dynamic auth URL for production:', authUrl);
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'exchange_code':
        // Exchange authorization code for access token
        const exchangeCode = requestData.code;
        if (!exchangeCode) {
          return new Response(
            JSON.stringify({ error: 'Authorization code is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Exchanging code for access token (production mode):', exchangeCode);
        
        try {
          // Access Token Exchange Endpoint - same for sandbox and production
          const tokenResponse = await fetch(`${TIKTOK_API_URL}/oauth2/access_token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app_id: tiktokAppId,
              secret: tiktokAppSecret,
              auth_code: exchangeCode,
              grant_type: 'authorization_code',
            }),
          });

          const tokenResult = await tokenResponse.json();
          console.log('Token exchange response status:', tokenResponse.status);
          console.log('Token exchange response code:', tokenResult.code);
          console.log('Token exchange response message:', tokenResult.message);
          
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
          
          if (tokenResult.code !== 0) {
            console.error('Token exchange failed with TikTok error:', tokenResult.message);
            return new Response(
              JSON.stringify({ 
                error: `TikTok API Error: ${tokenResult.message}`,
                code: tokenResult.code,
                details: tokenResult
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          
          // Log the full token data structure to help with debugging
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
          // Advertiser List Endpoint - same for sandbox and production
          const accountsResponse = await fetch(`${TIKTOK_API_URL}/v1.3/oauth2/advertiser/get/`, {
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
          
          // More detailed logging for ad accounts response
          if (accountsResult.code !== 0) {
            console.warn('TikTok API returned non-zero code:', accountsResult.code, accountsResult.message);
          } else {
            console.log('Successfully fetched ad accounts, count:', 
              accountsResult.data?.list?.length || 0
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
          // Campaign List Endpoint - same for sandbox and production
          const campaignsResponse = await fetch(`${TIKTOK_API_URL}/v1.3/campaign/get/`, {
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
        
      case 'create_campaign':
        // Create a new campaign for a specific ad account
        const createToken = requestData.accessToken;
        const createAdvertiserId = requestData.advertiserId;
        const campaignData = requestData.campaignData;
        
        if (!createToken || !createAdvertiserId || !campaignData) {
          return new Response(
            JSON.stringify({ error: 'Access token, advertiser ID, and campaign data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Creating campaign for advertiser:', createAdvertiserId);
        console.log('Campaign data:', campaignData);
        
        try {
          // Campaign Create Endpoint - same for sandbox and production
          const createResponse = await fetch(`${TIKTOK_API_URL}/v1.3/campaign/create/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Access-Token': createToken,
            },
            body: JSON.stringify({
              advertiser_id: createAdvertiserId,
              campaign_name: campaignData.name,
              campaign_type: campaignData.objective || "REACH",
              budget_mode: campaignData.budget_mode || "BUDGET_MODE_DAY",
              budget: campaignData.budget || 1000,
              objective_type: campaignData.objective_type || "REACH",
              app_promotion_type: campaignData.app_promotion_type || "APP_INSTALL",
            }),
          });

          const createResult = await createResponse.json();
          console.log('Campaign create response status:', createResponse.status);
          
          if (!createResponse.ok) {
            console.error('Campaign creation failed with status:', createResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to create campaign', 
                details: createResult,
                status: createResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: createResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(createResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error creating campaign:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create campaign', message: error.message }),
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

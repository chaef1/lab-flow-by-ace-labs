
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
          // Campaign List Endpoint with expanded fields for more complete data
          const campaignsResponse = await fetch(
            `${META_API_URL}/${accountId}/campaigns?fields=name,status,objective,spend,created_time,start_time,stop_time,daily_budget,lifetime_budget,insights{impressions,clicks,ctr,cost_per_result,reach}&access_token=${campaignToken}`
          );
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
        // Create a new campaign
        const createToken = requestData.accessToken;
        const createAccountId = requestData.accountId;
        const campaignData = requestData.campaignData;
        
        if (!createToken || !createAccountId || !campaignData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and campaign data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Creating campaign for account:', createAccountId);
        
        try {
          // Prepare the campaign creation data
          const campaignParams = new URLSearchParams();
          campaignParams.append('name', campaignData.name);
          campaignParams.append('objective', campaignData.objective);
          campaignParams.append('status', 'PAUSED'); // Start as paused for safety
          
          if (campaignData.dailyBudget) {
            campaignParams.append('daily_budget', Math.floor(campaignData.dailyBudget * 100).toString());
          } else if (campaignData.lifetimeBudget) {
            campaignParams.append('lifetime_budget', Math.floor(campaignData.lifetimeBudget * 100).toString());
          }
          
          if (campaignData.startTime) {
            campaignParams.append('start_time', campaignData.startTime);
          }
          
          if (campaignData.endTime) {
            campaignParams.append('end_time', campaignData.endTime);
          }
          
          if (campaignData.specialAdCategories) {
            campaignParams.append('special_ad_categories', JSON.stringify(campaignData.specialAdCategories));
          }
          
          campaignParams.append('access_token', createToken);
          
          // Create Campaign Endpoint
          const createResponse = await fetch(`${META_API_URL}/${createAccountId}/campaigns`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: campaignParams.toString()
          });
          
          const createResult = await createResponse.json();
          
          console.log('Campaign creation response status:', createResponse.status);
          
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
        
      case 'create_ad_set':
        // Create a new ad set
        const adSetToken = requestData.accessToken;
        const adSetAccountId = requestData.accountId;
        const adSetData = requestData.adSetData;
        
        if (!adSetToken || !adSetAccountId || !adSetData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and ad set data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Creating ad set for account:', adSetAccountId);
        
        try {
          // Prepare the ad set creation data
          const adSetParams = new URLSearchParams();
          adSetParams.append('name', adSetData.name);
          adSetParams.append('campaign_id', adSetData.campaignId);
          adSetParams.append('optimization_goal', adSetData.optimizationGoal || 'REACH');
          adSetParams.append('billing_event', adSetData.billingEvent || 'IMPRESSIONS');
          adSetParams.append('status', 'PAUSED'); // Start as paused for safety
          
          // Budget settings
          if (adSetData.dailyBudget) {
            adSetParams.append('daily_budget', Math.floor(adSetData.dailyBudget * 100).toString());
          } else if (adSetData.lifetimeBudget) {
            adSetParams.append('lifetime_budget', Math.floor(adSetData.lifetimeBudget * 100).toString());
          }
          
          // Schedule
          if (adSetData.startTime) {
            adSetParams.append('start_time', adSetData.startTime);
          }
          if (adSetData.endTime) {
            adSetParams.append('end_time', adSetData.endTime);
          }
          
          // Targeting - stringify the targeting spec
          if (adSetData.targeting) {
            adSetParams.append('targeting', JSON.stringify(adSetData.targeting));
          }
          
          // Bid amount
          if (adSetData.bidAmount) {
            adSetParams.append('bid_amount', Math.floor(adSetData.bidAmount * 100).toString());
          }
          
          adSetParams.append('access_token', adSetToken);
          
          // Create Ad Set Endpoint
          const adSetResponse = await fetch(`${META_API_URL}/${adSetAccountId}/adsets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: adSetParams.toString()
          });
          
          const adSetResult = await adSetResponse.json();
          
          console.log('Ad set creation response status:', adSetResponse.status);
          
          if (!adSetResponse.ok) {
            console.error('Ad set creation failed with status:', adSetResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to create ad set', 
                details: adSetResult,
                status: adSetResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: adSetResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(adSetResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error creating ad set:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create ad set', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
      case 'create_ad':
        // Create a new ad
        const adToken = requestData.accessToken;
        const adAccountId = requestData.accountId;
        const adData = requestData.adData;
        
        if (!adToken || !adAccountId || !adData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and ad data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Creating ad for account:', adAccountId);
        
        try {
          // Prepare the ad creation data
          const adParams = new URLSearchParams();
          adParams.append('name', adData.name);
          adParams.append('adset_id', adData.adsetId);
          adParams.append('status', 'PAUSED'); // Start as paused for safety
          
          // Creative
          if (adData.creativeId) {
            adParams.append('creative', JSON.stringify({ creative_id: adData.creativeId }));
          } else if (adData.creative) {
            adParams.append('creative', JSON.stringify(adData.creative));
          }
          
          adParams.append('access_token', adToken);
          
          // Create Ad Endpoint
          const adResponse = await fetch(`${META_API_URL}/${adAccountId}/ads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: adParams.toString()
          });
          
          const adResult = await adResponse.json();
          
          console.log('Ad creation response status:', adResponse.status);
          
          if (!adResponse.ok) {
            console.error('Ad creation failed with status:', adResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to create ad', 
                details: adResult,
                status: adResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: adResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(adResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error creating ad:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create ad', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'get_audiences':
        // Get custom audiences for a specific ad account
        const audienceToken = requestData.accessToken;
        const audienceAccountId = requestData.accountId;
        
        if (!audienceToken || !audienceAccountId) {
          return new Response(
            JSON.stringify({ error: 'Access token and account ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching audiences for account:', audienceAccountId);
        
        try {
          // Custom Audiences Endpoint
          const audiencesResponse = await fetch(
            `${META_API_URL}/${audienceAccountId}/customaudiences?fields=name,subtype,approximate_count,description,time_created&access_token=${audienceToken}`
          );
          const audiencesResult = await audiencesResponse.json();
          
          console.log('Audiences response status:', audiencesResponse.status);
          
          if (!audiencesResponse.ok) {
            console.error('Audiences request failed with status:', audiencesResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch audiences', 
                details: audiencesResult,
                status: audiencesResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: audiencesResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(audiencesResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching audiences:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch audiences', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'upload_creative':
        // Upload a creative asset to the ad account
        const creativeToken = requestData.accessToken;
        const creativeAccountId = requestData.accountId;
        const fileData = requestData.fileData;
        
        if (!creativeToken || !creativeAccountId || !fileData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and file data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Uploading creative for account:', creativeAccountId);
        
        try {
          // For simplicity in this implementation, we'll assume fileData contains a URL 
          // to an image that's already hosted somewhere
          const creativeParams = new URLSearchParams();
          creativeParams.append('name', fileData.name || 'Ad Creative');
          
          if (fileData.url) {
            creativeParams.append('image_url', fileData.url);
          }
          
          creativeParams.append('access_token', creativeToken);
          
          // Ad Creative Endpoint
          const creativeResponse = await fetch(`${META_API_URL}/${creativeAccountId}/adimages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: creativeParams.toString()
          });
          
          const creativeResult = await creativeResponse.json();
          
          console.log('Creative upload response status:', creativeResponse.status);
          
          if (!creativeResponse.ok) {
            console.error('Creative upload failed with status:', creativeResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to upload creative', 
                details: creativeResult,
                status: creativeResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: creativeResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(creativeResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error uploading creative:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to upload creative', message: error.message }),
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

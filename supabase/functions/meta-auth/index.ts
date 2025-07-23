
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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

    if (!metaAppSecret) {
      console.error('Meta API credentials not found');
      return new Response(
        JSON.stringify({ error: 'Meta API credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    const action = requestData.action || '';
    
    console.log(`Processing request with action: ${action}`, { requestData });

    // Use a switch statement to handle different API actions
    switch (action) {
      case 'exchange_code':
        // Exchange authorization code for access token using Graph API
        const code = requestData.code;
        const redirectUri = requestData.redirectUri;
        
        if (!code || !redirectUri) {
          return new Response(
            JSON.stringify({ error: 'Authorization code and redirect URI are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Exchanging Meta authorization code for access token...');
        
        try {
          // Use Facebook's App ID for advertising
          const appId = "1749800232620671";
          
          // Exchange code for access token using Graph API
          const tokenResponse = await fetch(`https://graph.facebook.com/v17.0/oauth/access_token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: appId,
              client_secret: metaAppSecret,
              redirect_uri: redirectUri,
              code: code
            }),
          });

          const tokenResult = await tokenResponse.json();
          console.log('Token exchange response status:', tokenResponse.status);
          
          if (!tokenResponse.ok) {
            console.error('Token exchange failed with status:', tokenResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to exchange code for token', 
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

      case 'get_user_permissions':
        // Get user permissions and accessible accounts
        const permissionToken = requestData.accessToken;
        if (!permissionToken) {
          return new Response(
            JSON.stringify({ error: 'Access token is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching user permissions and accounts...');
        
        try {
          // Get user's basic info and permissions
          const userResponse = await fetch(`https://graph.facebook.com/v17.0/me?fields=id,name,email&access_token=${permissionToken}`);
          const userData = await userResponse.json();
          
          // Get Business Managers
          const businessResponse = await fetch(`https://graph.facebook.com/v17.0/me/businesses?fields=id,name,verification_status,primary_page&access_token=${permissionToken}`);
          const businessData = await businessResponse.json();
          
          // Get Ad Accounts
          const accountsResponse = await fetch(`https://graph.facebook.com/v17.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name,business&access_token=${permissionToken}`);
          const accountsData = await accountsResponse.json();
          
          // Get Pages
          const pagesResponse = await fetch(`https://graph.facebook.com/v17.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username},category&access_token=${permissionToken}`);
          const pagesData = await pagesResponse.json();
          
          console.log('All permissions data fetched successfully');
          
          if (!userResponse.ok || !businessResponse.ok || !accountsResponse.ok || !pagesResponse.ok) {
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch user permissions', 
                details: { userData, businessData, accountsData, pagesData }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          
          return new Response(
            JSON.stringify({
              user: userData,
              businesses: businessData,
              adAccounts: accountsData,
              pages: pagesData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch user permissions', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'get_user_profile':
        // Get user profile information
        const userToken = requestData.access_token || requestData.accessToken;
        if (!userToken) {
          return new Response(
            JSON.stringify({ error: 'Access token is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching user profile with token:', userToken.substring(0, 5) + '...');
        
        try {
          const profileResponse = await fetch(`https://graph.facebook.com/v17.0/me?fields=id,name,email,picture.width(200).height(200)&access_token=${userToken}`);
          const profileResult = await profileResponse.json();
          
          console.log('User profile response status:', profileResponse.status);
          
          if (!profileResponse.ok) {
            console.error('User profile request failed with status:', profileResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch user profile', 
                details: profileResult,
                status: profileResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: profileResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(profileResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch user profile', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'get_ad_accounts':
        // Get ad accounts for the authenticated user
        const accessToken = requestData.accessToken;
        if (!accessToken) {
          return new Response(
            JSON.stringify({ error: 'Access token is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching ad accounts with token:', accessToken.substring(0, 5) + '...');
        
        try {
          const accountsResponse = await fetch(`https://graph.facebook.com/v17.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`);
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

      case 'get_pages':
        // Get Facebook Pages for the authenticated user
        const pageToken = requestData.accessToken;
        if (!pageToken) {
          return new Response(
            JSON.stringify({ error: 'Access token is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Fetching pages with token:', pageToken.substring(0, 5) + '...');
        
        try {
          // First, let's check what the user's basic info is
          console.log('Checking user basic info first...');
          const userInfoResponse = await fetch(`https://graph.facebook.com/v17.0/me?fields=id,name,email&access_token=${pageToken}`);
          const userInfo = await userInfoResponse.json();
          console.log('User info:', userInfo);
          
          // Now check permissions
          console.log('Checking token permissions...');
          const permissionsResponse = await fetch(`https://graph.facebook.com/v17.0/me/permissions?access_token=${pageToken}`);
          const permissionsInfo = await permissionsResponse.json();
          console.log('Token permissions:', permissionsInfo);
          
          // Try the pages endpoint
          const pagesResponse = await fetch(`https://graph.facebook.com/v17.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username},category,tasks&access_token=${pageToken}`);
          const pagesResult = await pagesResponse.json();
          
          console.log('Pages response status:', pagesResponse.status);
          console.log('Pages response data structure:', JSON.stringify(pagesResult, null, 2));
          
          if (!pagesResponse.ok) {
            console.error('Pages request failed with status:', pagesResponse.status);
            console.error('Pages error details:', pagesResult);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to fetch pages', 
                details: pagesResult,
                status: pagesResponse.status,
                userInfo: userInfo,
                permissions: permissionsInfo
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: pagesResponse.status }
            );
          }

          // Check if the user has no pages
          if (pagesResult.data && Array.isArray(pagesResult.data) && pagesResult.data.length === 0) {
            console.log('No pages found for user. This could mean:');
            console.log('1. User has no Facebook pages');
            console.log('2. User is not an admin/editor of any pages');
            console.log('3. Pages are not properly connected to their account');
            
            // Return the empty result but with helpful debug info
            return new Response(
              JSON.stringify({
                ...pagesResult,
                debugInfo: {
                  userInfo,
                  permissions: permissionsInfo,
                  message: 'No Facebook pages found. You need to create a Facebook page or have admin access to an existing page to run ads.'
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Additional debugging - check if pages exist and what permissions they have
          if (pagesResult.data && Array.isArray(pagesResult.data)) {
            console.log(`Found ${pagesResult.data.length} pages:`);
            pagesResult.data.forEach((page, index) => {
              console.log(`Page ${index + 1}:`, {
                id: page.id,
                name: page.name,
                category: page.category,
                tasks: page.tasks,
                hasInstagram: !!page.instagram_business_account
              });
            });
          }
          
          return new Response(
            JSON.stringify({
              ...pagesResult,
              debugInfo: {
                userInfo,
                permissions: permissionsInfo
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching pages:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch pages', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'upload_creative':
        // Upload creative asset to Meta ad account
        const uploadToken = requestData.accessToken;
        const uploadAccountId = requestData.accountId;
        const creativeData = requestData.creativeData;
        
        if (!uploadToken || !uploadAccountId || !creativeData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and creative data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Uploading creative for account:', uploadAccountId);
        
        try {
          // For images, upload to ad images endpoint
          if (creativeData.type === 'image') {
            const formData = new FormData();
            formData.append('filename', creativeData.filename);
            formData.append('bytes', creativeData.bytes);
            formData.append('access_token', uploadToken);

            const uploadResponse = await fetch(`https://graph.facebook.com/v17.0/${uploadAccountId}/adimages`, {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            console.log('Creative upload response status:', uploadResponse.status);
            
            if (!uploadResponse.ok) {
              console.error('Creative upload failed with status:', uploadResponse.status);
              return new Response(
                JSON.stringify({ 
                  error: 'Failed to upload creative', 
                  details: uploadResult,
                  status: uploadResponse.status
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: uploadResponse.status }
              );
            }
            
            return new Response(
              JSON.stringify(uploadResult),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // For videos, upload to ad videos endpoint
          if (creativeData.type === 'video') {
            const formData = new FormData();
            formData.append('filename', creativeData.filename);
            formData.append('file_size', creativeData.fileSize);
            formData.append('access_token', uploadToken);

            const uploadResponse = await fetch(`https://graph.facebook.com/v17.0/${uploadAccountId}/advideos`, {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            console.log('Video upload response status:', uploadResponse.status);
            
            if (!uploadResponse.ok) {
              console.error('Video upload failed with status:', uploadResponse.status);
              return new Response(
                JSON.stringify({ 
                  error: 'Failed to upload video', 
                  details: uploadResult,
                  status: uploadResponse.status
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: uploadResponse.status }
              );
            }
            
            return new Response(
              JSON.stringify(uploadResult),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          throw new Error('Unsupported creative type');
        } catch (error) {
          console.error('Error uploading creative:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to upload creative', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'create_ad_creative':
        // Create ad creative with uploaded assets
        const creativeToken = requestData.accessToken;
        const creativeAccountId = requestData.accountId;
        const adCreativeData = requestData.adCreativeData;
        
        if (!creativeToken || !creativeAccountId || !adCreativeData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and ad creative data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Creating ad creative for account:', creativeAccountId);
        
        try {
          const creativePayload = {
            name: adCreativeData.name,
            object_story_spec: {
              page_id: adCreativeData.pageId,
              link_data: {
                image_hash: adCreativeData.imageHash,
                link: adCreativeData.link,
                message: adCreativeData.message,
                name: adCreativeData.headline,
                description: adCreativeData.description,
                call_to_action: {
                  type: adCreativeData.callToAction || 'LEARN_MORE'
                }
              }
            },
            access_token: creativeToken
          };

          const creativeResponse = await fetch(`https://graph.facebook.com/v17.0/${creativeAccountId}/adcreatives`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(creativePayload),
          });

          const creativeResult = await creativeResponse.json();
          console.log('Ad creative creation response status:', creativeResponse.status);
          
          if (!creativeResponse.ok) {
            console.error('Ad creative creation failed with status:', creativeResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to create ad creative', 
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
          console.error('Error creating ad creative:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create ad creative', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'create_ad':
        // Create ad with creative
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
          const adPayload = {
            name: adData.name,
            adset_id: adData.adSetId,
            creative: {
              creative_id: adData.creativeId
            },
            status: 'PAUSED',
            access_token: adToken
          };

          const adResponse = await fetch(`https://graph.facebook.com/v17.0/${adAccountId}/ads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adPayload),
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
          const campaignsResponse = await fetch(`https://graph.facebook.com/v17.0/${accountId}/campaigns?fields=id,name,status,objective,created_time,start_time,stop_time,daily_budget,lifetime_budget,spend&access_token=${campaignToken}`);
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
        const createAccountId = requestData.accountId;
        const campaignData = requestData.campaignData;
        
        if (!createToken || !createAccountId || !campaignData) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, and campaign data are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Creating campaign for account:', createAccountId);
        console.log('Campaign data:', campaignData);
        
        try {
          // Prepare the campaign creation payload for Meta API
          const metaCampaignData = {
            name: campaignData.name,
            objective: campaignData.objective,
            status: campaignData.status || 'PAUSED',
            access_token: createToken
          };

          // Add budget - Meta requires budget in cents
          if (campaignData.dailyBudget) {
            metaCampaignData.daily_budget = Math.round(campaignData.dailyBudget * 100); // Convert to cents
          } else if (campaignData.lifetimeBudget) {
            metaCampaignData.lifetime_budget = Math.round(campaignData.lifetimeBudget * 100); // Convert to cents
          }

          // Add start and end times if provided
          if (campaignData.startTime) {
            metaCampaignData.start_time = campaignData.startTime;
          }
          if (campaignData.endTime) {
            metaCampaignData.stop_time = campaignData.endTime;
          }

          // Add special ad categories if provided
          if (campaignData.specialAdCategories && campaignData.specialAdCategories.length > 0) {
            metaCampaignData.special_ad_categories = campaignData.specialAdCategories;
          }

          console.log('Meta API payload:', metaCampaignData);

          // Create campaign using Meta Graph API
          const createResponse = await fetch(`https://graph.facebook.com/v17.0/${createAccountId}/campaigns`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metaCampaignData),
          });

          const createResult = await createResponse.json();
          console.log('Campaign creation response status:', createResponse.status);
          console.log('Campaign creation response:', createResult);
          
          if (!createResponse.ok) {
            console.error('Campaign creation failed with status:', createResponse.status);
            console.error('Error details:', createResult);
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

      case 'update_campaign_status':
        // Update campaign status
        const updateToken = requestData.accessToken;
        const updateAccountId = requestData.accountId;
        const campaignId = requestData.campaignId;
        const newStatus = requestData.status;
        
        if (!updateToken || !updateAccountId || !campaignId || !newStatus) {
          return new Response(
            JSON.stringify({ error: 'Access token, account ID, campaign ID, and status are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`Updating campaign ${campaignId} status to ${newStatus}`);
        
        try {
          const updateResponse = await fetch(`https://graph.facebook.com/v17.0/${campaignId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: newStatus,
              access_token: updateToken
            }),
          });

          const updateResult = await updateResponse.json();
          console.log('Campaign update response status:', updateResponse.status);
          
          if (!updateResponse.ok) {
            console.error('Campaign update failed with status:', updateResponse.status);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to update campaign status', 
                details: updateResult,
                status: updateResponse.status
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: updateResponse.status }
            );
          }
          
          return new Response(
            JSON.stringify(updateResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error updating campaign status:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update campaign status', message: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

      case 'get_audiences':
        // Get custom audiences for the account
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
          const audiencesResponse = await fetch(`https://graph.facebook.com/v17.0/${audienceAccountId}/customaudiences?fields=id,name,approximate_count,description&access_token=${audienceToken}`);
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

      case 'create_ad_set':
        // Create ad set for campaign
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
          // Prepare ad set data for Meta API
          const metaAdSetData = {
            name: adSetData.name,
            campaign_id: adSetData.campaignId,
            optimization_goal: adSetData.optimizationGoal || 'LINK_CLICKS',
            billing_event: adSetData.billingEvent || 'LINK_CLICKS',
            targeting: adSetData.targeting || {
              geo_locations: { countries: ['ZA'] },
              age_min: 18,
              age_max: 65
            },
            status: 'PAUSED',
            access_token: adSetToken
          };

          // Add budget
          if (adSetData.dailyBudget) {
            metaAdSetData.daily_budget = Math.round(adSetData.dailyBudget * 100); // Convert to cents
          } else if (adSetData.lifetimeBudget) {
            metaAdSetData.lifetime_budget = Math.round(adSetData.lifetimeBudget * 100); // Convert to cents
          }

          // Add start and end times
          if (adSetData.startTime) {
            metaAdSetData.start_time = adSetData.startTime;
          }
          if (adSetData.endTime) {
            metaAdSetData.end_time = adSetData.endTime;
          }

          const adSetResponse = await fetch(`https://graph.facebook.com/v17.0/${adSetAccountId}/adsets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metaAdSetData),
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

      case 'subscribe_instagram_webhook':
        const instagramSubscribeResult = await subscribeInstagramWebhook(requestData.instagramAccountId, requestData.fields);
        return new Response(
          JSON.stringify(instagramSubscribeResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'get_instagram_subscriptions':
        const instagramSubsResult = await getInstagramSubscriptions(requestData.instagramAccountId);
        return new Response(
          JSON.stringify(instagramSubsResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

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

// Instagram webhook subscription management
async function subscribeInstagramWebhook(instagramAccountId: string, fields: string[]) {
  const webhookAccessToken = Deno.env.get('INSTAGRAM_WEBHOOK_ACCESS_TOKEN');
  
  if (!webhookAccessToken) {
    throw new Error('Instagram webhook access token not configured');
  }

  const subscriptionUrl = `https://graph.facebook.com/v17.0/${instagramAccountId}/subscribed_apps`;
  
  const response = await fetch(subscriptionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscribed_fields: fields.join(','),
      access_token: webhookAccessToken
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Instagram webhook subscription error:', data);
    throw new Error(data.error?.message || 'Failed to subscribe to Instagram webhooks');
  }

  return {
    success: true,
    subscriptions: data,
    message: `Successfully subscribed to fields: ${fields.join(', ')}`
  };
}

async function getInstagramSubscriptions(instagramAccountId: string) {
  const webhookAccessToken = Deno.env.get('INSTAGRAM_WEBHOOK_ACCESS_TOKEN');
  
  if (!webhookAccessToken) {
    throw new Error('Instagram webhook access token not configured');
  }

  const subscriptionUrl = `https://graph.facebook.com/v17.0/${instagramAccountId}/subscribed_apps?access_token=${webhookAccessToken}`;
  
  const response = await fetch(subscriptionUrl);
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Get Instagram subscriptions error:', data);
    throw new Error(data.error?.message || 'Failed to get Instagram subscriptions');
  }

  return {
    success: true,
    subscriptions: data.data || [],
    message: 'Successfully retrieved Instagram webhook subscriptions'
  };
}

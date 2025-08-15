import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Function Start ===');
    console.log('Method:', req.method);
    console.log('AYRSHARE_API_KEY exists:', !!ayrshareApiKey);
    
    if (!ayrshareApiKey) {
      console.error('AYRSHARE_API_KEY missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not configured',
          debug: 'AYRSHARE_API_KEY environment variable is missing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { username, platform } = requestBody;
    
    if (!username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Clean username
    const cleanHandle = username.startsWith('@') ? username.substring(1) : username;
    const platformParam = platform || 'instagram';
    
    console.log('Searching for:', cleanHandle, 'on', platformParam);
    
    // Build Ayrshare API URL
    const params = new URLSearchParams();
    params.append('platforms[0]', platformParam);
    
    if (platformParam === 'instagram') {
      params.append('instagramUser', cleanHandle);
    } else if (platformParam === 'tiktok') {
      params.append('tiktokUser', cleanHandle);
    } else {
      params.append('instagramUser', cleanHandle);
    }
    
    const ayrshareUrl = `https://api.ayrshare.com/api/brand/byUser?${params.toString()}`;
    console.log('Ayrshare URL:', ayrshareUrl);
    
    // Make request to Ayrshare
    const ayrshareResponse = await fetch(ayrshareUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Ayrshare response status:', ayrshareResponse.status);
    
    if (!ayrshareResponse.ok) {
      const errorText = await ayrshareResponse.text();
      console.error('Ayrshare error:', errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Ayrshare API error: ${ayrshareResponse.status}`,
          details: errorText,
          status: ayrshareResponse.status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const ayrshareData = await ayrshareResponse.json();
    console.log('Ayrshare data keys:', Object.keys(ayrshareData));
    
    const platformData = ayrshareData[platformParam];
    
    if (!platformData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No ${platformParam} data found`,
          available_platforms: Object.keys(ayrshareData)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Simple profile transformation
    const profile = {
      username: platformData.username || cleanHandle,
      full_name: platformData.name || platformData.displayName || '',
      bio: platformData.biography || platformData.description || '',
      follower_count: platformData.followersCount || platformData.fans || 0,
      following_count: platformData.followsCount || platformData.following || 0,
      posts_count: platformData.mediaCount || platformData.videoCount || 0,
      profile_picture_url: platformData.profilePictureUrl || platformData.avatar || '',
      verified: platformData.verified || false,
      platform: platformParam,
      engagement_rate: 0,
      category: 'Micro',
      account_type: 'public',
      website: platformData.website || '',
      location: '',
      avg_likes: 0,
      avg_comments: 0,
      last_post_date: null,
      id: crypto.randomUUID()
    };

    console.log('Returning profile for:', profile.username);

    return new Response(
      JSON.stringify({
        success: true,
        profile: profile,
        profiles: [profile],
        source: 'ayrshare_api'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})
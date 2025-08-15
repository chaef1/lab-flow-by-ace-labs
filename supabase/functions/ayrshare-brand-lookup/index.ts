import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers directly in this file to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('=== Ayrshare Brand Lookup Function ===');
  console.log('AYRSHARE_API_KEY exists:', !!ayrshareApiKey);
  
  if (!ayrshareApiKey) {
    console.error('AYRSHARE_API_KEY environment variable is not set!');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server configuration error',
        user_help: 'Ayrshare API key is not configured. Please contact support.',
        technical_details: 'AYRSHARE_API_KEY environment variable missing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { username, platform } = await req.json()

    console.log('Request params:', { username, platform });

    if (!username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username is required',
          user_help: 'Please enter a username (with or without @)'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Clean the handle
    let cleanHandle = username.trim()
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.substring(1)
    }

    console.log(`Searching for: ${cleanHandle} on platform: ${platform || 'instagram'}`)

    const platformParam = platform || 'instagram'
    const params = new URLSearchParams()
    params.append('platforms[0]', platformParam)
    
    if (platformParam === 'instagram') {
      params.append('instagramUser', cleanHandle)
    } else if (platformParam === 'tiktok') {
      params.append('tiktokUser', cleanHandle)
    } else {
      params.append('instagramUser', cleanHandle)
    }
    
    const ayrshareUrl = `https://api.ayrshare.com/api/brand/byUser?${params.toString()}`
    
    console.log(`Making request to Ayrshare API: ${ayrshareUrl}`)
    
    const ayrshareResponse = await fetch(ayrshareUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Ayrshare API response status: ${ayrshareResponse.status}`)

    if (!ayrshareResponse.ok) {
      const errorText = await ayrshareResponse.text()
      console.error('Ayrshare API error:', errorText);
      
      let userFriendlyError = 'Search failed';
      let userHelp = '';
      
      if (ayrshareResponse.status === 401) {
        userFriendlyError = 'Authentication failed with Ayrshare API';
        userHelp = 'API key may be invalid. Please contact support.';
      } else if (ayrshareResponse.status === 403) {
        userFriendlyError = 'Access denied';
        userHelp = 'Social account may not be connected to Ayrshare.';
      } else if (ayrshareResponse.status === 404) {
        userFriendlyError = `Profile not found on ${platformParam}`;
        userHelp = `Username "${cleanHandle}" doesn't exist. Check spelling and try again.`;
      } else if (ayrshareResponse.status === 429) {
        userFriendlyError = 'Too many requests';
        userHelp = 'Please wait a few minutes before searching again.';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyError,
          user_help: userHelp,
          platform: platformParam,
          technical_details: `Status: ${ayrshareResponse.status}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const ayrshareData = await ayrshareResponse.json()
    console.log('Ayrshare response:', JSON.stringify(ayrshareData, null, 2))

    const platformData = ayrshareData[platformParam]
    
    if (!platformData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No ${platformParam} data found`,
          user_help: `The username may not exist on ${platformParam} or the profile may be private`,
          platform: platformParam
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // Transform to our profile format
    const profile = {
      username: platformData.username || cleanHandle,
      full_name: platformData.name || platformData.displayName || '',
      bio: platformData.biography || platformData.description || '',
      follower_count: platformData.followersCount || platformData.fans || 0,
      following_count: platformData.followsCount || platformData.following || 0,
      posts_count: platformData.mediaCount || platformData.videoCount || 0,
      profile_picture_url: platformData.profilePictureUrl || platformData.avatar || '',
      verified: platformData.verified || false,
      website: platformData.website || '',
      engagement_rate: 0,
      category: 'Micro',
      platform: platformParam,
      account_type: 'public',
      location: '',
      avg_likes: 0,
      avg_comments: 0,
      last_post_date: null,
      id: crypto.randomUUID()
    }

    console.log('Returning profile:', profile.username)

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
    )

  } catch (error) {
    console.error('Error in ayrshare-brand-lookup:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: `Search failed: ${error.message}`,
        user_help: 'Please try again or contact support if the issue persists',
        technical_details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
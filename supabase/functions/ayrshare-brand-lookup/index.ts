Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('=== Function Started ===')
  console.log('Method:', req.method)

  try {
    const body = await req.json()
    console.log('Body received:', JSON.stringify(body))
    
    const { username, platform } = body
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')
    
    console.log('Username:', username)
    console.log('Platform:', platform) 
    console.log('API Key exists:', !!ayrshareApiKey)
    console.log('API Key length:', ayrshareApiKey?.length || 0)
    
    if (!ayrshareApiKey) {
      console.log('No API key found')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not configured',
          debug: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!username) {
      console.log('No username provided')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username required',
          debug: true
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Clean username
    let cleanHandle = username.trim()
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.substring(1)
    }
    
    const platformParam = platform || 'instagram'
    console.log('Cleaned handle:', cleanHandle)
    console.log('Platform param:', platformParam)
    
    // Build Ayrshare URL
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
    console.log('Ayrshare URL:', ayrshareUrl)
    
    // Make API call
    console.log('Making Ayrshare API call...')
    const response = await fetch(ayrshareUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('API Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('API Error:', errorText)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Ayrshare API error: ${response.status}`,
          details: errorText,
          debug: true
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const data = await response.json()
    console.log('API Response keys:', Object.keys(data))
    
    const platformData = data[platformParam]
    if (!platformData) {
      console.log('No platform data found')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No profile data found',
          available: Object.keys(data),
          debug: true
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Platform data found, creating profile...')
    
    // Create profile
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
        source: 'ayrshare_api',
        debug: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Function error:', error.message)
    console.error('Stack:', error.stack)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal error',
        details: error.message,
        debug: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
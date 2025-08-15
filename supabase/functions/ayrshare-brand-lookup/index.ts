const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('=== Function called ===');
  
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing request...');
    
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body));
    
    const { username, platform } = body;
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY');
    
    console.log('Username:', username);
    console.log('Platform:', platform);
    console.log('API Key exists:', !!ayrshareApiKey);
    
    if (!ayrshareApiKey) {
      console.log('No API key - returning error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!username) {
      console.log('No username - returning error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Just return a mock profile for now to test
    console.log('Returning test profile');
    const testProfile = {
      username: username,
      full_name: 'Test User',
      bio: 'This is a test profile',
      follower_count: 1000,
      following_count: 500,
      posts_count: 100,
      profile_picture_url: '',
      verified: false,
      website: '',
      engagement_rate: 5.5,
      category: 'Micro',
      platform: platform || 'instagram',
      account_type: 'public',
      location: '',
      avg_likes: 50,
      avg_comments: 5,
      last_post_date: null,
      id: crypto.randomUUID()
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        profile: testProfile,
        profiles: [testProfile],
        source: 'test_data'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
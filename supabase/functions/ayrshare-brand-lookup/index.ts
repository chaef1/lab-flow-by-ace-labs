import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')

Deno.serve(async (req) => {
  console.log('=== Ayrshare Brand Lookup Function Started ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing POST request');
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { username, platform } = body;
    
    console.log('AYRSHARE_API_KEY exists:', !!ayrshareApiKey);
    console.log('AYRSHARE_API_KEY length:', ayrshareApiKey?.length || 0);
    
    if (!ayrshareApiKey) {
      console.error('AYRSHARE_API_KEY missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error',
          user_help: 'Ayrshare API key is not configured. Please contact support.',
          technical_details: 'AYRSHARE_API_KEY environment variable missing'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!username) {
      console.error('No username provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username is required',
          user_help: 'Please enter a username (with or without @)'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clean username
    let cleanHandle = username.trim();
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.substring(1);
    }
    
    const platformParam = platform || 'instagram';
    console.log(`Searching for: ${cleanHandle} on platform: ${platformParam}`);
    
    // Build Ayrshare API URL
    const params = new URLSearchParams();
    params.append('platforms[0]', platformParam);
    
    switch (platformParam.toLowerCase()) {
      case 'instagram':
        params.append('instagramUser', cleanHandle);
        break;
      case 'tiktok':
        params.append('tiktokUser', cleanHandle);
        break;
      case 'facebook':
        params.append('facebookUser', cleanHandle);
        break;
      case 'twitter':
      case 'x':
        params.append('twitterUser', cleanHandle);
        break;
      default:
        params.append('instagramUser', cleanHandle);
    }
    
    const ayrshareUrl = `https://api.ayrshare.com/api/brand/byUser?${params.toString()}`;
    console.log('Ayrshare URL:', ayrshareUrl);
    
    // Make request to Ayrshare
    const ayrshareResponse = await fetch(ayrshareUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    console.log('Ayrshare response status:', ayrshareResponse.status);
    
    if (!ayrshareResponse.ok) {
      const errorText = await ayrshareResponse.text();
      console.error('Ayrshare API error:', errorText);
      console.error('Full response status:', ayrshareResponse.status);
      
      let userFriendlyError = 'Search failed';
      let userHelp = '';
      
      if (ayrshareResponse.status === 401) {
        userFriendlyError = 'Authentication failed with Ayrshare API';
        userHelp = 'API key may be invalid. Please contact support.';
      } else if (ayrshareResponse.status === 403) {
        userFriendlyError = 'Access denied to search this profile';
        userHelp = 'This may indicate the social account is not properly connected to Ayrshare.';
      } else if (ayrshareResponse.status === 404) {
        userFriendlyError = `${platformParam} profile not found`;
        userHelp = `Username "${cleanHandle}" doesn't exist on ${platformParam}. Check spelling and try again.`;
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
          technical_details: `Status: ${ayrshareResponse.status}`,
          suggestions: [
            'Check username spelling',
            'Try without @ symbol',
            'Ensure the profile is public',
            'Try again in a few minutes'
          ]
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ayrshareData = await ayrshareResponse.json();
    console.log('Ayrshare response data keys:', Object.keys(ayrshareData));
    console.log('Ayrshare response data:', JSON.stringify(ayrshareData, null, 2));
    
    const platformData = ayrshareData[platformParam];
    
    if (!platformData) {
      console.error(`No ${platformParam} data found in response`);
      console.log('Available platforms:', Object.keys(ayrshareData));
      return new Response(
        JSON.stringify({
          success: false,
          error: `No ${platformParam} data found`,
          user_help: `The username may not exist on ${platformParam} or the profile may be private`,
          platform: platformParam,
          available_platforms: Object.keys(ayrshareData)
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Platform data found:', JSON.stringify(platformData, null, 2));

    // Categorize influencer based on follower count
    const categorizeInfluencer = (followerCount: number): string => {
      if (followerCount >= 1000000) return 'Celebrity/Elite'
      if (followerCount >= 100001) return 'Macro'
      if (followerCount >= 50001) return 'Mid-Tier'
      if (followerCount >= 10001) return 'Micro'
      if (followerCount >= 1000) return 'Nano'
      return 'Emerging'
    }

    // Transform platform data to our profile format
    let profile;
    
    if (platformParam === 'instagram') {
      profile = {
        username: platformData.username || cleanHandle,
        full_name: platformData.name || '',
        bio: platformData.biography || '',
        follower_count: platformData.followersCount || 0,
        following_count: platformData.followsCount || 0,
        posts_count: platformData.mediaCount || 0,
        profile_picture_url: platformData.profilePictureUrl || '',
        verified: platformData.verified || false,
        website: platformData.website || '',
        engagement_rate: 0,
        category: categorizeInfluencer(platformData.followersCount || 0),
        platform: platformParam,
        account_type: 'public',
        location: '',
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        id: platformData.id || crypto.randomUUID(),
        ig_id: platformData.igId
      };
    } else if (platformParam === 'tiktok') {
      const followerCount = platformData.followersCount || platformData.fans || 0;
      const heartCount = platformData.heartCount || platformData.likesCount || 0;
      const videoCount = platformData.videoCount || platformData.videos || 1;
      const avgLikesPerVideo = videoCount > 0 ? heartCount / videoCount : 0;
      const engagementRate = followerCount > 0 ? (avgLikesPerVideo / followerCount) * 100 : 0;
      
      profile = {
        username: platformData.username || platformData.uniqueId || cleanHandle,
        full_name: platformData.displayName || platformData.nickname || '',
        bio: platformData.description || platformData.signature || '',
        follower_count: followerCount,
        following_count: platformData.followingCount || 0,
        posts_count: videoCount,
        profile_picture_url: platformData.avatar || platformData.avatarLarge || '',
        verified: platformData.verified || false,
        website: platformData.website || '',
        engagement_rate: Math.round(engagementRate * 100) / 100,
        category: categorizeInfluencer(followerCount),
        platform: platformParam,
        account_type: 'public',
        location: platformData.region || '',
        avg_likes: Math.round(avgLikesPerVideo),
        avg_comments: 0,
        last_post_date: null,
        id: platformData.id || platformData.secUid || crypto.randomUUID(),
        total_likes: heartCount,
        video_count: videoCount
      };
    } else {
      // Generic profile for other platforms
      profile = {
        username: platformData.username || cleanHandle,
        full_name: platformData.name || platformData.displayName || '',
        bio: platformData.biography || platformData.description || '',
        follower_count: platformData.followersCount || 0,
        following_count: platformData.followsCount || platformData.followingCount || 0,
        posts_count: platformData.mediaCount || 0,
        profile_picture_url: platformData.profilePictureUrl || platformData.avatar || '',
        verified: platformData.verified || false,
        website: platformData.website || '',
        engagement_rate: 0,
        category: categorizeInfluencer(platformData.followersCount || 0),
        platform: platformParam,
        account_type: 'public',
        location: '',
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        id: platformData.id || crypto.randomUUID()
      };
    }

    console.log('Transformed profile:', JSON.stringify(profile, null, 2));

    // Store search in database (optional)
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userData.user.id)
          .maybeSingle();
        
        if (userProfile?.organization_id) {
          await supabase
            .from('social_media_searches')
            .insert({
              user_id: userData.user.id,
              organization_id: userProfile.organization_id,
              platform: platformParam,
              username: cleanHandle
            });
        }
      }
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: profile,
        profiles: [profile],
        source: 'ayrshare_api'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error.message);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Search failed',
        user_help: 'Please try again or contact support if the issue persists',
        technical_details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
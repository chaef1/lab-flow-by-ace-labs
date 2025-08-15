import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')!

Deno.serve(async (req) => {
  console.log('=== Environment Check ===');
  console.log('SUPABASE_URL:', supabaseUrl?.substring(0, 20) + '...');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey?.substring(0, 20) + '...');
  console.log('AYRSHARE_API_KEY exists:', !!ayrshareApiKey);
  console.log('AYRSHARE_API_KEY length:', ayrshareApiKey?.length || 0);
  console.log('AYRSHARE_API_KEY prefix:', ayrshareApiKey?.substring(0, 10) + '...' || 'MISSING');

  if (!ayrshareApiKey) {
    console.error('CRITICAL: AYRSHARE_API_KEY environment variable is not set!');
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

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Ayrshare Brand Lookup Request ===');
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { username, platform, searchType } = await req.json()

    console.log('Request params:', { username, platform, searchType });

    if (!username) {
      console.error('No username provided');
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

    console.log(`Fetching profile for handle: ${username} on platform: ${platform}`)

    // Clean the handle - remove @ symbol and extract from URLs
    let cleanHandle = username.trim()
    
    // Remove @ symbol if present
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.substring(1)
    }

    // Extract username from various social media URL formats
    const urlPatterns = [
      /(?:instagram\.com\/|instagr\.am\/)([^\/\?]+)/,
      /(?:tiktok\.com\/@?)([^\/\?]+)/,
      /(?:twitter\.com\/|x\.com\/)([^\/\?]+)/,
      /(?:facebook\.com\/)([^\/\?]+)/,
      /(?:linkedin\.com\/in\/)([^\/\?]+)/,
      /(?:youtube\.com\/(?:@|c\/|user\/))([^\/\?]+)/,
      /(?:pinterest\.com\/)([^\/\?]+)/,
      /(?:snapchat\.com\/add\/)([^\/\?]+)/
    ]

    for (const pattern of urlPatterns) {
      const match = cleanHandle.match(pattern)
      if (match) {
        cleanHandle = match[1]
        break
      }
    }

    console.log(`Cleaned handle: ${cleanHandle}`)

    const platformParam = platform || 'instagram'
    const params = new URLSearchParams()
    params.append('platforms[0]', platformParam)
    
    // Use correct parameter name based on platform
    switch (platformParam.toLowerCase()) {
      case 'instagram':
        params.append('instagramUser', cleanHandle)
        break
      case 'tiktok':
        params.append('tiktokUser', cleanHandle)
        break
      case 'facebook':
        params.append('facebookUser', cleanHandle)
        break
      case 'twitter':
      case 'x':
        params.append('twitterUser', cleanHandle)
        break
      default:
        params.append('instagramUser', cleanHandle) // Default to Instagram
    }
    
    const ayrshareUrl = `https://api.ayrshare.com/api/brand/byUser?${params.toString()}`
    
    console.log(`Making request to Ayrshare API`)
    console.log(`Request URL: ${ayrshareUrl}`)
    console.log(`API Key prefix: ${ayrshareApiKey ? ayrshareApiKey.substring(0, 10) : 'MISSING'}...`)
    console.log(`API Key length: ${ayrshareApiKey ? ayrshareApiKey.length : 0}`)
    
    const requestHeaders = {
      'Authorization': `Bearer ${ayrshareApiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Supabase-Edge-Function'
    }
    
    console.log('Request headers:', Object.keys(requestHeaders))
    
    const ayrshareResponse = await fetch(ayrshareUrl, {
      method: 'GET',
      headers: requestHeaders
    })

    console.log(`Ayrshare API response status: ${ayrshareResponse.status}`)

    if (!ayrshareResponse.ok) {
      const errorText = await ayrshareResponse.text()
      console.error('=== Ayrshare API Error ===');
      console.error('Status:', ayrshareResponse.status);
      console.error('Error text:', errorText);
      console.error('Request headers sent:', ayrshareResponse.headers);
      console.error('Full request details:', {
        url: ayrshareUrl,
        method: 'GET',
        platform: platformParam,
        username: cleanHandle
      });
      
      // Parse error response if it's JSON
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
        console.error('Parsed error response:', parsedError);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
      
      // Provide specific error reasoning based on status codes
      let userFriendlyError = 'Search failed';
      let userHelp = '';
      
      if (ayrshareResponse.status === 401) {
        userFriendlyError = 'Authentication failed with Ayrshare API';
        userHelp = 'API key may be invalid. Please contact support.';
      } else if (ayrshareResponse.status === 403) {
        // Check for specific 403 error messages
        if (parsedError?.message?.includes('API Key not valid')) {
          userFriendlyError = 'API Key authentication failed';
          userHelp = 'The API key may be incorrect or expired. Please verify your Ayrshare API key.';
        } else if (parsedError?.message?.includes('not linked') || parsedError?.message?.includes('connect')) {
          userFriendlyError = `${platformParam} account not properly connected`;
          userHelp = `Please ensure your ${platformParam} account is properly connected and authorized in your Ayrshare dashboard under Social Accounts.`;
        } else {
          userFriendlyError = 'Access denied to search this profile';
          userHelp = 'This may indicate the social account is not properly connected to Ayrshare or the profile search feature is not available for your account type.';
        }
      } else if (ayrshareResponse.status === 404) {
        userFriendlyError = `${platformParam} profile not found`;
        userHelp = `Username "${cleanHandle}" doesn't exist on ${platformParam}. Check spelling and try again.`;
      } else if (ayrshareResponse.status === 429) {
        userFriendlyError = 'Too many requests';
        userHelp = 'Please wait a few minutes before searching again.';
      } else if (errorText.includes('Missing social account') && platformParam === 'tiktok') {
        userFriendlyError = 'TikTok account not connected to Ayrshare';
        userHelp = 'Connect your TikTok account in Ayrshare dashboard to enable searches.';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyError,
          user_help: userHelp,
          platform_error: platformParam === 'tiktok',
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const ayrshareData = await ayrshareResponse.json()
    console.log('Ayrshare response data:', JSON.stringify(ayrshareData, null, 2))

    // Extract platform-specific data from the response
    const platformData = ayrshareData[platformParam]
    
    if (!platformData) {
      console.error(`No data found for platform: ${platformParam}`);
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
    
    // Categorize influencer based on follower count
    const categorizeInfluencer = (followerCount: number): string => {
      if (followerCount >= 1000000) return 'Celebrity/Elite'
      if (followerCount >= 100001) return 'Macro'
      if (followerCount >= 50001) return 'Mid-Tier'
      if (followerCount >= 10001) return 'Micro'
      if (followerCount >= 1000) return 'Nano'
      return 'Emerging'
    }

    // Transform Ayrshare data to our format based on platform
    let transformedProfile
    
    if (platformParam === 'instagram') {
      transformedProfile = {
        username: platformData.username || cleanHandle,
        full_name: platformData.name || '',
        bio: platformData.biography || '',
        follower_count: platformData.followersCount || 0,
        following_count: platformData.followsCount || 0,
        engagement_rate: 0,
        verified: false,
        profile_picture_url: platformData.profilePictureUrl || '',
        website: platformData.website || '',
        category: categorizeInfluencer(platformData.followersCount || 0),
        platform: platformParam,
        posts_count: platformData.mediaCount || 0,
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: 'public',
        location: '',
        id: platformData.id || crypto.randomUUID(),
        ig_id: platformData.igId
      }
    } else if (platformParam === 'tiktok') {
      // Enhanced TikTok data extraction
      console.log('Processing TikTok data:', platformData);
      
      const followerCount = platformData.followersCount || platformData.fans || platformData.follower_count || 0;
      const heartCount = platformData.heartCount || platformData.likesCount || platformData.totalLikes || platformData.likes_count || 0;
      const videoCount = platformData.videoCount || platformData.videos || platformData.postsCount || platformData.video_count || 1;
      
      // Calculate engagement metrics
      const avgLikesPerVideo = videoCount > 0 ? heartCount / videoCount : 0;
      const engagementRate = followerCount > 0 ? (avgLikesPerVideo / followerCount) * 100 : 0;
      
      transformedProfile = {
        username: platformData.username || platformData.handle || platformData.uniqueId || cleanHandle,
        full_name: platformData.displayName || platformData.name || platformData.nickname || '',
        bio: platformData.description || platformData.signature || platformData.biography || '',
        follower_count: followerCount,
        following_count: platformData.followingCount || platformData.following || 0,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        verified: platformData.verified || false,
        profile_picture_url: platformData.avatar || platformData.avatarLarge || platformData.avatarMedium || platformData.profilePictureUrl || '',
        website: platformData.website || '',
        category: categorizeInfluencer(followerCount),
        platform: platformParam,
        posts_count: videoCount,
        avg_likes: Math.round(avgLikesPerVideo),
        avg_comments: platformData.avgComments || 0,
        last_post_date: platformData.lastPostDate || null,
        account_type: 'public',
        location: platformData.region || platformData.location || '',
        id: platformData.id || platformData.secUid || crypto.randomUUID(),
        // TikTok specific fields
        total_likes: heartCount,
        video_count: videoCount,
        signature: platformData.signature || '',
        unique_id: platformData.uniqueId || cleanHandle,
        sec_uid: platformData.secUid || ''
      };
      
      console.log('Transformed TikTok profile:', transformedProfile);
    } else if (platformParam === 'facebook') {
      transformedProfile = {
        username: platformData.username || cleanHandle,
        full_name: platformData.name || '',
        bio: platformData.description || platformData.about || '',
        follower_count: platformData.followersCount || platformData.fanCount || 0,
        following_count: 0,
        engagement_rate: 0,
        verified: platformData.verificationStatus === 'blue_verified',
        profile_picture_url: platformData.picture?.data?.url || '',
        website: platformData.website || '',
        category: categorizeInfluencer(platformData.followersCount || platformData.fanCount || 0),
        platform: platformParam,
        posts_count: 0,
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: 'public',
        location: platformData.location?.city || '',
        id: platformData.id || crypto.randomUUID()
      }
    } else {
      // Generic transformation for other platforms
      transformedProfile = {
        username: platformData.username || platformData.handle || cleanHandle,
        full_name: platformData.displayName || platformData.name || '',
        bio: platformData.description || platformData.bio || '',
        follower_count: platformData.followersCount || platformData.followers_count || 0,
        following_count: platformData.followingCount || platformData.following_count || 0,
        engagement_rate: 0,
        verified: platformData.verified || false,
        profile_picture_url: platformData.avatar || platformData.picture?.data?.url || '',
        website: platformData.website || '',
        category: categorizeInfluencer(platformData.followersCount || platformData.followers_count || 0),
        platform: platformParam,
        posts_count: 0,
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: 'personal',
        location: platformData.location?.city || '',
        id: platformData.id || crypto.randomUUID()
      }
    }

    // Store search in database with organization_id
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userData.user.id)
          .maybeSingle()
        
        if (userProfile?.organization_id) {
          await supabase
            .from('social_media_searches')
            .insert({
              user_id: userData.user.id,
              organization_id: userProfile.organization_id,
              platform: platform || 'instagram',
              username: cleanHandle
            })
        }
      }
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: transformedProfile,
        profiles: [transformedProfile],
        source: 'ayrshare_api',
        enhanced_data: platformParam === 'tiktok' ? {
          metrics_calculated: true,
          engagement_analysis: {
            rate: transformedProfile.engagement_rate,
            avg_likes_per_video: transformedProfile.avg_likes
          },
          data_source: 'ayrshare_enhanced'
        } : undefined
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
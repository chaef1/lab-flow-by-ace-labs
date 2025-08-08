import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const tiktokClientKey = Deno.env.get('TIKTOK_APP_ID')
const tiktokClientSecret = Deno.env.get('TIKTOK_API_SECRET')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { username, action, access_token } = await req.json()

    console.log('TikTok Display API request:', { username, action })

    // Check if TikTok credentials are available
    if (!tiktokClientKey || !tiktokClientSecret) {
      console.log('TikTok credentials check:', { 
        hasAppId: !!tiktokClientKey, 
        hasSecret: !!tiktokClientSecret 
      })
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Display API credentials not configured',
          requires_setup: true,
          missing: {
            app_id: !tiktokClientKey,
            api_secret: !tiktokClientSecret
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    switch (action) {
      case 'get_user_info':
        return await getUserInfo(username, access_token)
      case 'get_videos':
        return await getUserVideos(username, access_token)
      case 'embed_video':
        return await embedVideo(username, access_token)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('TikTok Display API error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getUserInfo(username: string, accessToken?: string) {
  try {
    console.log(`Getting user info for: ${username}`)
    
    // Get access token if not provided
    const token = accessToken || await getDisplayApiAccessToken()
    
    const response = await fetch(`https://open.tiktokapis.com/v2/user/info/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        fields: [
          'open_id',
          'union_id', 
          'avatar_url',
          'avatar_url_100',
          'avatar_url_200',
          'display_name',
          'bio_description',
          'profile_deep_link',
          'is_verified',
          'follower_count',
          'following_count',
          'likes_count',
          'video_count'
        ]
      })
    })

    const data = await response.json()
    console.log('TikTok Display API user response:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || `TikTok API error: ${response.status}`)
    }
    
    // Calculate enhanced metrics
    const userInfo = data.data?.user
    const enhancedMetrics = userInfo ? calculateDisplayMetrics(userInfo) : {}
    
    return new Response(
      JSON.stringify({
        success: true,
        source: 'tiktok_display_api',
        user_info: userInfo,
        enhanced_metrics: enhancedMetrics,
        profile_data: {
          id: userInfo?.open_id,
          username: username,
          full_name: userInfo?.display_name,
          bio: userInfo?.bio_description,
          avatar_url: userInfo?.avatar_url_200 || userInfo?.avatar_url,
          follower_count: userInfo?.follower_count || 0,
          following_count: userInfo?.following_count || 0,
          likes_count: userInfo?.likes_count || 0,
          video_count: userInfo?.video_count || 0,
          verified: userInfo?.is_verified || false,
          profile_url: userInfo?.profile_deep_link,
          platform: 'tiktok'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get user info error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to get user info: ${error.message}`,
        fallback_available: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}

async function getUserVideos(username: string, accessToken?: string) {
  try {
    console.log(`Getting videos for: ${username}`)
    
    // Get access token if not provided
    const token = accessToken || await getDisplayApiAccessToken()
    
    const response = await fetch(`https://open.tiktokapis.com/v2/video/list/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: [
          'id',
          'title',
          'cover_image_url',
          'embed_html',
          'embed_link',
          'video_description',
          'duration',
          'view_count',
          'like_count',
          'comment_count',
          'share_count',
          'create_time'
        ],
        max_count: 20
      })
    })

    const data = await response.json()
    console.log('TikTok Display API videos response:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || `TikTok API error: ${response.status}`)
    }
    
    const videos = data.data?.videos || []
    const videoAnalytics = videos.length ? calculateVideoAnalytics(videos) : {}
    
    return new Response(
      JSON.stringify({
        success: true,
        source: 'tiktok_display_api',
        videos: videos,
        video_analytics: videoAnalytics,
        total_count: data.data?.total || videos.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get videos error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to get videos: ${error.message}`,
        fallback_available: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}

async function embedVideo(videoId: string, accessToken?: string) {
  try {
    console.log(`Getting embed info for video: ${videoId}`)
    
    // Get access token if not provided
    const token = accessToken || await getDisplayApiAccessToken()
    
    const response = await fetch(`https://open.tiktokapis.com/v2/video/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: {
          video_ids: [videoId]
        },
        fields: [
          'id',
          'title',
          'embed_html', 
          'embed_link',
          'cover_image_url',
          'video_description',
          'view_count',
          'like_count',
          'comment_count',
          'share_count'
        ]
      })
    })

    const data = await response.json()
    console.log('TikTok Display API embed response:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || `TikTok API error: ${response.status}`)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        source: 'tiktok_display_api',
        video: data.data?.videos?.[0],
        embed_html: data.data?.videos?.[0]?.embed_html,
        embed_link: data.data?.videos?.[0]?.embed_link
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Embed video error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Failed to get embed info: ${error.message}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}

async function getDisplayApiAccessToken(): Promise<string> {
  try {
    // Client credentials flow for TikTok Display API
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: tiktokClientKey!,
        client_secret: tiktokClientSecret!,
        grant_type: 'client_credentials'
      })
    })

    const data = await response.json()
    console.log('Token response:', { 
      success: response.ok, 
      hasToken: !!data.access_token,
      expires: data.expires_in 
    })

    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || 'Failed to get access token')
    }

    return data.access_token
  } catch (error) {
    console.error('Token acquisition error:', error)
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

function calculateDisplayMetrics(userInfo: any) {
  const followerCount = userInfo.follower_count || 0
  const likesCount = userInfo.likes_count || 0  
  const videoCount = userInfo.video_count || 1 // Avoid division by zero
  
  const engagementRate = followerCount > 0 ? (likesCount / (followerCount * videoCount)) * 100 : 0
  const avgLikesPerVideo = likesCount / videoCount
  const followerToLikesRatio = followerCount > 0 ? likesCount / followerCount : 0
  
  return {
    engagement_rate: Math.round(engagementRate * 100) / 100,
    avg_likes_per_video: Math.round(avgLikesPerVideo),
    follower_to_likes_ratio: Math.round(followerToLikesRatio * 100) / 100,
    content_frequency: calculatePostingFrequency(videoCount),
    influence_score: calculateInfluenceScore(userInfo),
    verification_status: userInfo.is_verified ? 'Verified' : 'Not Verified'
  }
}

function calculateVideoAnalytics(videos: any[]) {
  if (!videos.length) return {}
  
  const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0)
  const totalLikes = videos.reduce((sum, v) => sum + (v.like_count || 0), 0) 
  const totalComments = videos.reduce((sum, v) => sum + (v.comment_count || 0), 0)
  const totalShares = videos.reduce((sum, v) => sum + (v.share_count || 0), 0)
  
  const avgViews = Math.round(totalViews / videos.length)
  const avgLikes = Math.round(totalLikes / videos.length)
  const avgComments = Math.round(totalComments / videos.length)
  const avgShares = Math.round(totalShares / videos.length)
  
  return {
    total_videos: videos.length,
    avg_views: avgViews,
    avg_likes: avgLikes,
    avg_comments: avgComments,
    avg_shares: avgShares,
    total_engagement: totalLikes + totalComments + totalShares,
    best_performing_video: videos.reduce((best, current) => 
      (current.view_count || 0) > (best.view_count || 0) ? current : best
    ),
    viral_content_percentage: Math.round(
      (videos.filter(v => (v.view_count || 0) > avgViews * 3).length / videos.length) * 100
    ),
    engagement_rate: avgViews > 0 ? Math.round(((totalLikes + totalComments) / totalViews) * 100 * 100) / 100 : 0
  }
}

function calculatePostingFrequency(videoCount: number): string {
  // Estimate based on video count (would need creation dates for accuracy)
  if (videoCount > 200) return 'Very High (Daily+)'
  if (videoCount > 100) return 'High (3+ per week)'
  if (videoCount > 50) return 'Medium (1-2 per week)'
  if (videoCount > 20) return 'Low (1-3 per month)'
  return 'Very Low (Irregular)'
}

function calculateInfluenceScore(userInfo: any): number {
  const followerCount = userInfo.follower_count || 0
  const likesCount = userInfo.likes_count || 0
  const videoCount = userInfo.video_count || 1
  
  // Logarithmic follower weight (max 40 points)
  const followerWeight = followerCount > 0 ? Math.min(Math.log10(followerCount) * 8, 40) : 0
  
  // Engagement weight (max 30 points)
  const engagementRate = followerCount > 0 ? (likesCount / (followerCount * videoCount)) * 100 : 0
  const engagementWeight = Math.min(engagementRate * 6, 30)
  
  // Verification weight (20 points)
  const verificationWeight = userInfo.is_verified ? 20 : 0
  
  // Content volume weight (max 10 points)
  const contentWeight = Math.min(videoCount / 10, 10)
  
  const totalScore = followerWeight + engagementWeight + verificationWeight + contentWeight
  return Math.min(Math.round(totalScore), 100)
}
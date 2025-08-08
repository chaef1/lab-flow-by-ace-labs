import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { username, action, access_token } = await req.json()

    // Check if TikTok credentials are available
    if (!tiktokClientKey || !tiktokClientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'TikTok Research API credentials not configured',
          requires_setup: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    switch (action) {
      case 'get_user_info':
        return await getUserInfo(username, access_token)
      case 'get_video_list':
        return await getVideoList(username, access_token)
      case 'get_enhanced_analytics':
        return await getEnhancedAnalytics(username, access_token)
      case 'get_user_liked_videos':
        return await getUserLikedVideos(username, access_token)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('TikTok Research API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getUserInfo(username: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/research/user/info/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      fields: [
        'display_name',
        'bio_description', 
        'avatar_url',
        'is_verified',
        'follower_count',
        'following_count',
        'likes_count',
        'video_count'
      ]
    })
  })

  const data = await response.json()
  
  return new Response(
    JSON.stringify({
      success: true,
      user_info: data.data,
      enhanced_metrics: calculateEnhancedMetrics(data.data)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getVideoList(username: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/research/video/query/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: {
        and: [
          {
            operation: 'EQ',
            field_name: 'username',
            field_values: [username]
          }
        ]
      },
      fields: [
        'id',
        'title', 
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
  
  return new Response(
    JSON.stringify({
      success: true,
      videos: data.data.videos,
      analytics: calculateVideoAnalytics(data.data.videos)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAccessToken(): Promise<string> {
  // Implement client credentials flow for TikTok Research API
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_key: tiktokClientKey,
      client_secret: tiktokClientSecret,
      grant_type: 'client_credentials'
    })
  })

  const data = await response.json()
  return data.access_token
}

function calculateEnhancedMetrics(userInfo: any) {
  const engagement_rate = userInfo.likes_count / (userInfo.follower_count * userInfo.video_count) * 100
  const avg_likes_per_video = userInfo.likes_count / userInfo.video_count
  
  return {
    engagement_rate: Math.round(engagement_rate * 100) / 100,
    avg_likes_per_video: Math.round(avg_likes_per_video),
    follower_to_likes_ratio: userInfo.likes_count / userInfo.follower_count,
    content_frequency: calculatePostingFrequency(userInfo.video_count),
    influence_score: calculateInfluenceScore(userInfo)
  }
}

function calculateVideoAnalytics(videos: any[]) {
  if (!videos.length) return {}
  
  const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0)
  const totalLikes = videos.reduce((sum, v) => sum + v.like_count, 0) 
  const totalComments = videos.reduce((sum, v) => sum + v.comment_count, 0)
  const totalShares = videos.reduce((sum, v) => sum + v.share_count, 0)
  
  return {
    avg_views: Math.round(totalViews / videos.length),
    avg_likes: Math.round(totalLikes / videos.length),
    avg_comments: Math.round(totalComments / videos.length),
    avg_shares: Math.round(totalShares / videos.length),
    total_engagement: totalLikes + totalComments + totalShares,
    best_performing_video: videos.reduce((best, current) => 
      current.view_count > best.view_count ? current : best
    ),
    viral_content_percentage: videos.filter(v => v.view_count > totalViews/videos.length * 3).length / videos.length * 100
  }
}

function calculatePostingFrequency(videoCount: number) {
  // Estimate based on video count (would need creation dates for accuracy)
  if (videoCount > 100) return 'High (3+ per week)'
  if (videoCount > 50) return 'Medium (1-2 per week)'
  if (videoCount > 20) return 'Low (1-3 per month)'
  return 'Very Low (Irregular)'
}

function calculateInfluenceScore(userInfo: any) {
  const followerWeight = Math.log10(userInfo.follower_count) * 10
  const engagementWeight = (userInfo.likes_count / userInfo.follower_count) * 50
  const verificationWeight = userInfo.is_verified ? 20 : 0
  const contentWeight = Math.min(userInfo.video_count / 10, 20)
  
  return Math.min(Math.round(followerWeight + engagementWeight + verificationWeight + contentWeight), 100)
}

async function getEnhancedAnalytics(username: string, access_token?: string) {
  try {
    // Get user info
    const userInfoResponse = await getUserInfo(username, access_token)
    const userInfoData = await userInfoResponse.json()
    
    // Get video list
    const videoListResponse = await getVideoList(username, access_token)
    const videoData = await videoListResponse.json()
    
    // Combine and enhance the data
    const enhancedAnalytics = {
      success: true,
      source: 'tiktok_research_api',
      user_info: userInfoData.user_info,
      enhanced_metrics: userInfoData.enhanced_metrics,
      video_analytics: videoData.analytics,
      videos: videoData.videos?.slice(0, 5), // Top 5 videos
      performance_insights: {
        viral_content_count: videoData.videos?.filter((v: any) => 
          v.view_count > (videoData.analytics?.avg_views || 0) * 3
        ).length || 0,
        consistency_rating: calculateConsistencyRating(videoData.videos || []),
        growth_potential: calculateGrowthPotential(userInfoData.user_info, videoData.analytics)
      }
    }
    
    return new Response(
      JSON.stringify(enhancedAnalytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Enhanced analytics error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to retrieve enhanced analytics',
        fallback_available: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}

async function getUserLikedVideos(username: string, access_token?: string) {
  // This would require user authorization - placeholder for now
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Liked videos require user authorization',
      requires_user_auth: true 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
  )
}

function calculateConsistencyRating(videos: any[]): string {
  if (!videos.length) return 'Unknown'
  
  const avgViews = videos.reduce((sum, v) => sum + v.view_count, 0) / videos.length
  const variance = videos.reduce((sum, v) => sum + Math.pow(v.view_count - avgViews, 2), 0) / videos.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / avgViews
  
  if (coefficientOfVariation < 0.5) return 'Very Consistent'
  if (coefficientOfVariation < 1.0) return 'Consistent' 
  if (coefficientOfVariation < 1.5) return 'Moderate'
  return 'Variable'
}

function calculateGrowthPotential(userInfo: any, videoAnalytics: any): string {
  const followerCount = userInfo?.follower_count || 0
  const engagementRate = userInfo?.engagement_rate || 0
  const avgViews = videoAnalytics?.avg_views || 0
  
  // Simple scoring based on engagement and view-to-follower ratio
  const viewToFollowerRatio = followerCount > 0 ? avgViews / followerCount : 0
  
  if (engagementRate > 5 && viewToFollowerRatio > 2) return 'Very High'
  if (engagementRate > 3 && viewToFollowerRatio > 1.5) return 'High'
  if (engagementRate > 1.5 && viewToFollowerRatio > 1) return 'Medium'
  return 'Low'
}
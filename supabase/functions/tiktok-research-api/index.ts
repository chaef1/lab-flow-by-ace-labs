import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY')!
const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { username, action } = await req.json()

    switch (action) {
      case 'get_user_info':
        return await getUserInfo(username)
      case 'get_video_list':
        return await getVideoList(username)
      case 'get_user_liked_videos':
        return await getUserLikedVideos(username)
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
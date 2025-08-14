import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')!
const ayrsharePrivateKey = Deno.env.get('AYRSHARE_PRIVATE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, apiKey, profileKey, ...requestData } = await req.json()
    console.log(`Ayrshare TikTok action: ${action}`)

    const baseUrl = 'https://api.ayrshare.com/api'
    
    // Build headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'deflate, gzip, br',
      'Authorization': `Bearer ${apiKey || ayrshareApiKey}`
    }

    // Add Profile-Key header if provided
    if (profileKey) {
      headers['Profile-Key'] = profileKey
    }

    // Add Private-Key header if available for enhanced authentication
    if (ayrsharePrivateKey) {
      headers['Private-Key'] = ayrsharePrivateKey
    }

    switch (action) {
      case 'test_connection':
        return await testConnection(headers)
      case 'get_analytics':
        return await getAnalytics(headers, requestData)
      case 'get_history':
        return await getHistory(headers, requestData)
      case 'get_comments':
        return await getComments(headers, requestData)
      case 'schedule_post':
        return await schedulePost(headers, requestData)
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error: any) {
    console.error('Error in ayrshare-tiktok function:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function testConnection(headers: Record<string, string>) {
  try {
    console.log('Testing connection to Ayrshare API...')
    
    const response = await fetch('https://api.ayrshare.com/api/user', {
      method: 'GET',
      headers
    })

    const responseText = await response.text()
    console.log('Ayrshare /user response status:', response.status)
    console.log('Ayrshare /user response:', responseText.substring(0, 500))

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid API Key or Profile Key. Please check your credentials.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.')
      }
      throw new Error(`HTTP ${response.status}: ${responseText}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error('Invalid JSON response from Ayrshare API')
    }

    // Check if response indicates an error
    if (data.status === 'error') {
      throw new Error(data.message || 'Ayrshare API returned an error')
    }

    console.log('Connection test successful:', data)

    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Connection test failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

async function getAnalytics(headers: Record<string, string>, requestData: any) {
  try {
    const { platform = 'tiktok', timeRange = '30d' } = requestData
    
    // Convert timeRange to lastDays
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    }
    const lastDays = daysMap[timeRange] || 30

    console.log(`Fetching TikTok analytics for ${platform} platform, ${lastDays} days`)

    // Get social analytics (account metrics)
    const socialResponse = await fetch('https://api.ayrshare.com/api/analytics/social', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        platforms: [platform],
        lastDays: lastDays
      })
    })

    const socialText = await socialResponse.text()
    console.log('Social analytics response:', socialText.substring(0, 500))

    let socialData = {}
    if (socialResponse.ok) {
      try {
        socialData = JSON.parse(socialText)
      } catch (e) {
        console.error('Failed to parse social analytics response')
      }
    }

    // Get post analytics
    const postResponse = await fetch('https://api.ayrshare.com/api/analytics/post', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        platforms: [platform],
        lastDays: lastDays
      })
    })

    const postText = await postResponse.text()
    console.log('Post analytics response:', postText.substring(0, 500))

    let postData = {}
    if (postResponse.ok) {
      try {
        postData = JSON.parse(postText)
      } catch (e) {
        console.error('Failed to parse post analytics response')
      }
    }

    // Transform the data into a consistent format
    const transformedData = transformAnalyticsData(socialData, postData)

    return new Response(JSON.stringify({
      success: true,
      data: transformedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

async function getHistory(headers: Record<string, string>, requestData: any) {
  try {
    const { platform = 'tiktok' } = requestData
    
    console.log(`Fetching post history for ${platform} platform`)

    const response = await fetch('https://api.ayrshare.com/api/history', {
      method: 'GET',
      headers
    })

    const responseText = await response.text()
    console.log('History response status:', response.status)
    console.log('History response:', responseText.substring(0, 500))

    if (!response.ok) {
      throw new Error(`Failed to fetch history: HTTP ${response.status}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error('Invalid JSON response from history endpoint')
    }

    // Filter posts for TikTok platform and transform data
    const tikTokPosts = (data.posts || [])
      .filter((post: any) => 
        post.platforms?.includes('tiktok') || 
        post.platform === 'tiktok' ||
        post.postDetails?.some((detail: any) => detail.platform === 'tiktok')
      )
      .map((post: any) => transformPostData(post))

    return new Response(JSON.stringify({
      success: true,
      data: {
        posts: tikTokPosts,
        totalPosts: tikTokPosts.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error fetching history:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

async function getComments(headers: Record<string, string>, requestData: any) {
  try {
    const { postId, platform = 'tiktok' } = requestData
    
    if (!postId) {
      throw new Error('Post ID is required')
    }

    console.log(`Fetching comments for post ${postId} on ${platform}`)

    // Use the comments endpoint with platform specification
    const response = await fetch(`https://api.ayrshare.com/api/comments/${postId}?platform=${platform}&searchPlatformId=true`, {
      method: 'GET',
      headers
    })

    const responseText = await response.text()
    console.log('Comments response status:', response.status)
    console.log('Comments response:', responseText.substring(0, 500))

    if (!response.ok) {
      if (response.status === 404) {
        // Post not found or no comments
        return new Response(JSON.stringify({
          success: true,
          data: {
            comments: [],
            totalComments: 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`Failed to fetch comments: HTTP ${response.status}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error('Invalid JSON response from comments endpoint')
    }

    // Transform comments data
    const transformedComments = (data.comments || []).map((comment: any) => ({
      id: comment.id || comment.commentId || Math.random().toString(36),
      text: comment.text || comment.message || comment.comment || '',
      username: comment.username || comment.author || comment.user || 'Unknown',
      likeCount: comment.likeCount || comment.likes || 0,
      createdAt: comment.createdAt || comment.created_time || comment.timestamp || new Date().toISOString()
    }))

    return new Response(JSON.stringify({
      success: true,
      data: {
        comments: transformedComments,
        totalComments: transformedComments.length,
        postId: postId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

async function schedulePost(headers: Record<string, string>, requestData: any) {
  try {
    const { 
      post, 
      platforms = ['tiktok'], 
      scheduleDate, 
      mediaUrls, 
      shortenLinks = true 
    } = requestData

    if (!post) {
      throw new Error('Post content is required')
    }

    console.log('Scheduling TikTok post:', { post: post.substring(0, 100), platforms, scheduleDate })

    const payload: any = {
      post: post,
      platforms: platforms,
      shortenLinks: shortenLinks
    }

    // Add schedule date if provided
    if (scheduleDate) {
      payload.scheduleDate = scheduleDate
    }

    // Add media URLs if provided
    if (mediaUrls && mediaUrls.length > 0) {
      payload.mediaUrls = mediaUrls
    }

    const response = await fetch('https://api.ayrshare.com/api/post', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    console.log('Post scheduling response status:', response.status)
    console.log('Post scheduling response:', responseText.substring(0, 500))

    if (!response.ok) {
      throw new Error(`Failed to schedule post: HTTP ${response.status} - ${responseText}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error('Invalid JSON response from post endpoint')
    }

    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error scheduling post:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}

// Helper functions for data transformation
function transformAnalyticsData(socialData: any, postData: any) {
  return {
    followerCount: socialData.totalFollowers || socialData.followers || 0,
    videoCount: postData.totalPosts || socialData.posts || 0,
    likesCount: postData.totalLikes || socialData.totalLikes || 0,
    viewCount: postData.totalViews || socialData.views || 0,
    engagementRate: calculateEngagementRate(socialData, postData),
    growthData: socialData.growthData || [],
    recentPosts: postData.posts || []
  }
}

function transformPostData(post: any) {
  // Extract TikTok-specific data from post details
  const tikTokDetail = post.postDetails?.find((detail: any) => detail.platform === 'tiktok') || {}
  
  return {
    id: post.id || post.postId || Math.random().toString(36),
    videoUrl: tikTokDetail.postUrl || post.postUrl || '',
    caption: post.post || post.message || post.caption || '',
    viewCount: tikTokDetail.views || post.views || 0,
    likeCount: tikTokDetail.likes || post.likes || 0,
    commentCount: tikTokDetail.comments || post.comments || 0,
    shareCount: tikTokDetail.shares || post.shares || 0,
    createdAt: post.createdAt || post.created_time || post.timestamp || new Date().toISOString(),
    status: post.status || 'published'
  }
}

function calculateEngagementRate(socialData: any, postData: any): number {
  const followers = socialData.totalFollowers || socialData.followers || 0
  const avgEngagement = postData.avgEngagement || 0
  
  if (followers === 0) return 0
  
  // If we have avgEngagement, use it directly
  if (avgEngagement > 0) {
    return parseFloat((avgEngagement).toFixed(2))
  }
  
  // Otherwise calculate from likes and comments
  const totalLikes = postData.totalLikes || 0
  const totalComments = postData.totalComments || 0
  const totalPosts = postData.totalPosts || 1
  
  const avgInteractions = (totalLikes + totalComments) / totalPosts
  const engagementRate = (avgInteractions / followers) * 100
  
  return parseFloat(engagementRate.toFixed(2))
}

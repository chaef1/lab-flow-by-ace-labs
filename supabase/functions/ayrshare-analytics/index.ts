import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      console.error('Failed to parse request JSON:', e)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const { action, timeRange, platform, username, profileKey } = requestBody

    console.log('Ayrshare Analytics request:', { action, timeRange, platform, username })

    let apiUrl = 'https://api.ayrshare.com/api'
    let payload: any = {}
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'deflate, gzip, br',
      'Authorization': `Bearer ${ayrshareApiKey}`
    }

    // Add profile key to headers if provided - this is critical for user-specific data
    if (profileKey) {
      headers['Profile-Key'] = profileKey
      console.log('Using Profile-Key header:', profileKey.substring(0, 8) + '...')
    } else {
      console.log('Warning: No profile key provided - this may result in generic data or errors')
    }

    switch (action) {
      case 'account_insights':
        apiUrl += '/analytics/social'
        payload = {
          platforms: platform === 'all' ? ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'] : [platform],
          lastDays: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30
        }
        break

      case 'post_analytics':
        apiUrl += '/analytics/post'
        payload = {
          platforms: platform === 'all' ? ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'] : [platform],
          lastDays: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30
        }
        break

      case 'profile_analysis':
        if (!username) {
          throw new Error('Username is required for profile analysis')
        }
        // For profile analysis of external users, use the brand endpoint instead
        // since /analytics requires connected accounts with Profile-Key
        return new Response(JSON.stringify({
          success: false,
          error: 'Profile analysis requires connected social accounts. Use brand lookup for external profiles.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'hashtag_search':
        if (!username) { // Using username field for hashtag in this case
          throw new Error('Hashtag is required for hashtag search')
        }
        // For hashtag analysis, we'll use post analytics with hashtag filtering
        apiUrl += '/analytics/post'
        payload = {
          platforms: ['instagram'],
          lastDays: 30,
          hashtag: username.startsWith('#') ? username : `#${username}`
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    console.log('Making Ayrshare API request to:', apiUrl)
    console.log('Payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log('Ayrshare API response status:', response.status)
    console.log('Ayrshare API response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''))

    if (!response.ok) {
      // Log more details for debugging
      console.error('Ayrshare API error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      })
      throw new Error(`Ayrshare API error: ${response.status} - ${responseText}`)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse response as JSON:', e)
      console.error('Raw response:', responseText)
      throw new Error('Invalid JSON response from Ayrshare API')
    }

    // Check if Ayrshare returned an error in the response
    if (data.status === 'error' || (data.action && data.status === 'error')) {
      console.error('Ayrshare returned error:', data)
      throw new Error(data.message || data.details || 'Ayrshare API returned an error')
    }

    // Transform the data based on action type
    let transformedData = data

    switch (action) {
      case 'account_insights':
        transformedData = transformAccountInsights(data)
        break

      case 'post_analytics':
        transformedData = transformPostAnalytics(data)
        break

      case 'profile_analysis':
        transformedData = transformProfileAnalysis(data)
        break

      case 'hashtag_search':
        transformedData = transformHashtagSearch(data)
        break
    }

    return new Response(JSON.stringify({
      success: true,
      data: transformedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error in ayrshare-analytics function:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Transform functions for different data types
function transformAccountInsights(data: any) {
  return {
    followerGrowth: {
      total: data.totalFollowers || 0,
      growth: data.followerGrowthRate || 0,
      newFollowers: data.newFollowers || 0,
      unfollowers: data.unfollowers || 0
    },
    growthData: data.growthData || [],
    demographics: {
      ageGroups: data.demographics?.ageGroups || [],
      genders: data.demographics?.genders || [],
      topCities: data.demographics?.topCities || []
    },
    activity: {
      bestPostTimes: data.activity?.bestTimes || [],
      bestDays: data.activity?.bestDays || []
    },
    contentPerformance: {
      topHashtags: data.content?.topHashtags || []
    }
  }
}

function transformPostAnalytics(data: any) {
  return {
    metrics: {
      totalPosts: data.totalPosts || 0,
      avgEngagement: data.avgEngagement || 0,
      totalReach: data.totalReach || 0,
      totalImpressions: data.totalImpressions || 0,
      chartData: data.chartData || []
    },
    posts: data.posts || []
  }
}

function transformProfileAnalysis(data: any) {
  // Transform analytics data for profile analysis
  // Since we're using social analytics, adapt the response
  const analytics = data.analytics || data
  
  return {
    username: analytics.username || '',
    displayName: analytics.displayName || analytics.full_name || '',
    bio: analytics.bio || '',
    avatar: analytics.avatar || analytics.profile_picture_url || '',
    verified: analytics.verified || false,
    followers: analytics.followers || analytics.follower_count || 0,
    following: analytics.following || analytics.following_count || 0,
    posts: analytics.posts || analytics.posts_count || 0,
    engagement: {
      rate: analytics.engagement_rate || analytics.engagementRate || 0,
      avgLikes: analytics.avg_likes || analytics.avgLikes || 0,
      avgComments: analytics.avg_comments || analytics.avgComments || 0,
      avgShares: analytics.avg_shares || analytics.avgShares || 0
    },
    authenticity: {
      score: calculateAuthenticityScore(analytics),
      fakeFollowers: Math.random() * 10, // Placeholder - would need real analysis
      botComments: Math.random() * 5
    },
    demographics: {
      ageGroups: analytics.demographics?.ageGroups || {
        '18-24': Math.random() * 30,
        '25-34': Math.random() * 40,
        '35-44': Math.random() * 20,
        '45+': Math.random() * 10
      },
      genders: analytics.demographics?.genders || {
        female: Math.random() * 100,
        male: 100 - (Math.random() * 100)
      }
    }
  }
}

function transformHashtagSearch(data: any) {
  // Transform post analytics data for hashtag search
  const posts = data.posts || []
  const totalPosts = posts.length || 0
  const avgEngagement = posts.reduce((sum: number, post: any) => sum + (post.engagement || 0), 0) / totalPosts || 0
  
  return {
    hashtag: data.hashtag || '',
    totalPosts: totalPosts,
    avgEngagement: avgEngagement,
    topPosts: posts.slice(0, 10) || [],
    difficulty: calculateHashtagDifficulty(totalPosts)
  }
}

function calculateAuthenticityScore(profile: any): number {
  // Simple authenticity calculation based on engagement rate and follower patterns
  const engagementRate = profile.engagement_rate || 0
  const followerCount = profile.follower_count || 0
  
  let score = 50 // Base score
  
  // Higher engagement rate = higher authenticity
  if (engagementRate > 5) score += 20
  else if (engagementRate > 2) score += 10
  
  // Reasonable follower to following ratio
  const ratio = followerCount / (profile.following_count || 1)
  if (ratio > 10) score += 15
  else if (ratio > 2) score += 10
  
  // Verified accounts get bonus points
  if (profile.verified) score += 15
  
  return Math.min(100, Math.max(0, score))
}

function calculateHashtagDifficulty(totalPosts: number): string {
  if (totalPosts > 1000000) return 'Very High'
  if (totalPosts > 500000) return 'High'
  if (totalPosts > 100000) return 'Medium'
  if (totalPosts > 10000) return 'Low'
  return 'Very Low'
}
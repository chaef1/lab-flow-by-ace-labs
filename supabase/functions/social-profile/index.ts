
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY') || ''

// Create a single Deno deploy function that can handle multiple platforms
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { platform, username } = await req.json()
    
    if (!platform || !username) {
      return new Response(
        JSON.stringify({ error: 'Platform and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate platform
    if (!['instagram', 'tiktok'].includes(platform)) {
      return new Response(
        JSON.stringify({ error: 'Platform must be instagram or tiktok' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching ${platform} profile for user: ${username}`)
    
    // Use appropriate Apify actor based on platform
    const actorId = platform === 'instagram' 
      ? 'apify/instagram-profile-scraper' 
      : 'apify/tiktok-scraper'
    
    // Call Apify API
    const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'startUrls': [{ 'url': `https://${platform}.com/${username.replace('@', '')}` }],
        'resultsType': 'details',
        'resultsLimit': 1,
        'waitUntilReady': true
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Apify API error: ${response.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ error: `Failed to fetch ${platform} data`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const runResponse = await response.json()
    const runId = runResponse.data.id
    console.log(`Run created with ID: ${runId}`)
    
    // Wait for the run to complete and get the results
    const maxWaitTime = 30000 // 30 seconds
    const startTime = Date.now()
    
    let runFinished = false
    let datasetResponse
    
    // Poll for completion
    while (!runFinished && (Date.now() - startTime < maxWaitTime)) {
      // Check run status
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`)
      
      if (!statusResponse.ok) {
        console.error(`Failed to check run status: ${statusResponse.status}`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // wait 2 seconds before next check
        continue
      }
      
      const statusData = await statusResponse.json()
      
      if (statusData.data.status === 'SUCCEEDED') {
        runFinished = true
        // Get the dataset items
        datasetResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}`)
        
        if (!datasetResponse.ok) {
          const errorText = await datasetResponse.text()
          console.error(`Failed to fetch dataset: ${datasetResponse.status} - ${errorText}`)
          return new Response(
            JSON.stringify({ error: `Failed to fetch profile data from dataset` }),
            { status: datasetResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED-OUT') {
        console.error(`Run failed with status: ${statusData.data.status}`)
        return new Response(
          JSON.stringify({ error: `Profile scraping failed with status: ${statusData.data.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Still running, wait before checking again
        console.log(`Run status: ${statusData.data.status}, waiting...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    if (!runFinished) {
      console.error('Run timed out')
      return new Response(
        JSON.stringify({ error: 'Profile scraping timed out' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Process results based on the platform
    const resultData = await datasetResponse.json()
    console.log(`Got ${resultData.length} results from dataset`)
    
    // Extract profile data from Apify response and format it to match our app structure
    let profileData = {}
    
    if (platform === 'instagram') {
      // Instagram profile data structure
      const profile = resultData[0]
      
      if (!profile || !profile.username) {
        console.error('Instagram profile not found in response')
        return new Response(
          JSON.stringify({ error: 'Instagram profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Map Apify data to our app format
      profileData = {
        username: profile.username,
        full_name: profile.fullName,
        biography: profile.biography,
        follower_count: profile.followersCount,
        following_count: profile.followingCount,
        post_count: profile.postsCount,
        is_verified: profile.verified,
        profile_pic_url: profile.profilePicUrl,
        // Calculate approximate engagement rate (if posts are available)
        engagement_rate: profile.latestPosts && profile.latestPosts.length > 0 && profile.followersCount > 0
          ? calculateEngagementRate(profile.latestPosts, profile.followersCount)
          : 0
      }
    } else if (platform === 'tiktok') {
      // TikTok profile data structure
      const profile = resultData[0]
      
      if (!profile || !profile.userInfo || !profile.userInfo.user) {
        console.error('TikTok profile not found in response')
        return new Response(
          JSON.stringify({ error: 'TikTok profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const userInfo = profile.userInfo
      
      // Map Apify data to our app format
      profileData = {
        username: userInfo.user.uniqueId,
        full_name: userInfo.user.nickname,
        biography: userInfo.user.signature,
        follower_count: userInfo.stats.followerCount,
        following_count: userInfo.stats.followingCount,
        post_count: userInfo.stats.videoCount,
        is_verified: userInfo.user.verified,
        profile_pic_url: userInfo.user.avatarLarger,
        // Calculate approximate engagement rate
        engagement_rate: calculateTikTokEngagementRate(userInfo.stats)
      }
    }
    
    return new Response(
      JSON.stringify(profileData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to calculate engagement rate from Instagram posts
function calculateEngagementRate(posts, followersCount) {
  if (!posts || posts.length === 0 || followersCount === 0) return 0
  
  // Calculate average engagement across available posts
  const totalEngagement = posts.reduce((sum, post) => {
    return sum + (post.likesCount || 0) + (post.commentsCount || 0)
  }, 0)
  
  const averageEngagement = totalEngagement / posts.length
  const engagementRate = (averageEngagement / followersCount) * 100
  
  return parseFloat(engagementRate.toFixed(2))
}

// Helper function to calculate TikTok engagement rate
function calculateTikTokEngagementRate(stats) {
  if (!stats || stats.followerCount === 0 || stats.videoCount === 0) return 0
  
  // TikTok engagement can be estimated using likes, comments and shares
  const totalEngagement = stats.heartCount + (stats.diggCount || 0)
  const averageEngagement = totalEngagement / stats.videoCount
  const engagementRate = (averageEngagement / stats.followerCount) * 100
  
  return parseFloat(engagementRate.toFixed(2))
}

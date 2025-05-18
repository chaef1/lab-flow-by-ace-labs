
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
    const actorId = platform === 'instagram' ? 'apify/instagram-profile-scraper' : 'apify/tiktok-scraper'
    
    // Call Apify API
    const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        'startUrls': [{ 'url': `https://${platform}.com/${username.replace('@', '')}` }],
        'resultsType': 'details',
        'resultsLimit': 1
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
    
    const apifyResponse = await response.json()
    
    // Extract profile data from Apify response and format it to match our app structure
    let profileData = {}
    
    if (platform === 'instagram') {
      // Find the profile data in the output
      const output = apifyResponse.output?.body?.items?.[0] || {}
      
      if (!output.username) {
        return new Response(
          JSON.stringify({ error: 'Instagram profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Map Apify data to our app format
      profileData = {
        username: output.username,
        full_name: output.fullName,
        biography: output.biography,
        follower_count: output.followersCount,
        following_count: output.followsCount,
        post_count: output.postsCount,
        is_verified: output.verified,
        profile_pic_url: output.profilePicUrl,
        // Calculate approximate engagement rate (if posts are available)
        engagement_rate: output.latestPosts && output.latestPosts.length > 0 && output.followersCount > 0
          ? calculateEngagementRate(output.latestPosts, output.followersCount)
          : 0
      }
    } else if (platform === 'tiktok') {
      // Find the profile data in the output
      const output = apifyResponse.output?.body?.userInfo || {}
      
      if (!output.user?.uniqueId) {
        return new Response(
          JSON.stringify({ error: 'TikTok profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Map Apify data to our app format
      profileData = {
        username: output.user.uniqueId,
        full_name: output.user.nickname,
        biography: output.user.signature,
        follower_count: output.stats.followerCount,
        following_count: output.stats.followingCount,
        post_count: output.stats.videoCount,
        is_verified: output.user.verified,
        profile_pic_url: output.user.avatarLarger,
        // Calculate approximate engagement rate
        engagement_rate: calculateTikTokEngagementRate(output.stats)
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
  const totalEngagement = stats.heartCount + stats.diggCount
  const averageEngagement = totalEngagement / stats.videoCount
  const engagementRate = (averageEngagement / stats.followerCount) * 100
  
  return parseFloat(engagementRate.toFixed(2))
}


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
    
    // For Instagram, use the Apify actor
    if (platform === 'instagram') {
      const actorId = 'apify/instagram-profile-scraper'
      
      // Call Apify API
      const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'startUrls': [{ 'url': `https://instagram.com/${username.replace('@', '')}` }],
          'resultsType': 'details',
          'resultsLimit': 1,
          'waitUntilReady': true
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Apify API error: ${response.status} - ${errorText}`)
        return new Response(
          JSON.stringify({ error: `Failed to fetch Instagram data`, details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const runResponse = await response.json()
      const runId = runResponse.data.id
      console.log(`Instagram run created with ID: ${runId}`)
      
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
      
      // Process Instagram results
      const resultData = await datasetResponse.json()
      console.log(`Got ${resultData.length} Instagram results from dataset`)
      
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
      const profileData = {
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
      
      return new Response(
        JSON.stringify(profileData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } 
    // For TikTok, use the specified endpoint
    else if (platform === 'tiktok') {
      // Use the exact endpoint provided
      const endpoint = `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/runs?token=${APIFY_API_KEY}`
      console.log(`Using TikTok endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'startUrls': [`https://www.tiktok.com/@${username.replace('@', '')}`],
          'maxProfileCount': 1,
          'disableStatistics': false
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`TikTok API error: ${response.status} - ${errorText}`)
        return new Response(
          JSON.stringify({ error: `Failed to fetch TikTok data`, details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const runResponse = await response.json()
      const runId = runResponse.data.id
      console.log(`TikTok run created with ID: ${runId}`)
      
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
          console.error(`Failed to check TikTok run status: ${statusResponse.status}`)
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
            console.error(`Failed to fetch TikTok dataset: ${datasetResponse.status} - ${errorText}`)
            return new Response(
              JSON.stringify({ error: `Failed to fetch TikTok profile data from dataset` }),
              { status: datasetResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED-OUT') {
          console.error(`TikTok run failed with status: ${statusData.data.status}`)
          return new Response(
            JSON.stringify({ error: `TikTok profile scraping failed with status: ${statusData.data.status}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Still running, wait before checking again
          console.log(`TikTok run status: ${statusData.data.status}, waiting...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      if (!runFinished) {
        console.error('TikTok run timed out')
        return new Response(
          JSON.stringify({ error: 'TikTok profile scraping timed out' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Process TikTok results
      const resultData = await datasetResponse.json()
      console.log(`Got ${resultData.length} TikTok results from dataset`)
      console.log('TikTok data structure:', JSON.stringify(resultData[0]).substring(0, 500) + '...')
      
      const profile = resultData[0]
      
      if (!profile || !profile.userInfo) {
        console.error('TikTok profile not found in response')
        console.log('TikTok profile response:', JSON.stringify(resultData))
        return new Response(
          JSON.stringify({ error: 'TikTok profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const userInfo = profile.userInfo
      
      // Map the free TikTok scraper data to our app format
      const profileData = {
        username: userInfo.username || userInfo.uniqueId || username.replace('@', ''),
        full_name: userInfo.nickname || userInfo.fullName || '',
        biography: userInfo.signature || userInfo.description || '',
        follower_count: userInfo.followerCount || 0,
        following_count: userInfo.followingCount || 0, 
        post_count: userInfo.videoCount || 0,
        is_verified: userInfo.verified || false,
        profile_pic_url: userInfo.avatarMedium || userInfo.avatarUrl || '',
        engagement_rate: calculateTikTokEngagementRate(userInfo)
      }
      
      return new Response(
        JSON.stringify(profileData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
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
  
  // For the free-tiktok-scraper, we need to use different fields
  const followerCount = stats.followerCount || 0
  const heartCount = stats.heartCount || stats.likesCount || stats.likesTotalCount || 0
  const videoCount = stats.videoCount || 1
  
  // TikTok engagement can be estimated using likes
  const averageEngagement = heartCount / videoCount
  const engagementRate = (averageEngagement / followerCount) * 100
  
  return parseFloat(engagementRate.toFixed(2))
}

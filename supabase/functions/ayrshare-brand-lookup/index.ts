import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { handle, platform } = await req.json()

    if (!handle) {
      throw new Error('Handle is required')
    }

    console.log(`Fetching profile for handle: ${handle} on platform: ${platform}`)

    // Clean the handle - remove @ symbol and extract from URLs
    let cleanHandle = handle.trim()
    
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

    // Call Ayrshare analytics API for social profiles
    const ayrshareUrl = 'https://api.ayrshare.com/api/analytics/social'
    
    console.log(`Making request to Ayrshare API for handle: ${cleanHandle}, platform: ${platform}`)
    
    const ayrshareResponse = await fetch(ayrshareUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'User-Agent': 'Supabase-Edge-Function'
      },
      body: JSON.stringify({
        platforms: [platform || 'instagram'],
        lastDays: 30,
        username: cleanHandle
      })
    })

    console.log(`Ayrshare API response status: ${ayrshareResponse.status}`)

    if (!ayrshareResponse.ok) {
      const errorText = await ayrshareResponse.text()
      console.error('Ayrshare API error:', errorText)
      console.error('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ayrshareApiKey ? '[REDACTED]' : '[MISSING]'}`,
        'User-Agent': 'Supabase-Edge-Function'
      })
      console.error('Request body:', JSON.stringify({
        handle: cleanHandle,
        platform: platform || 'instagram'
      }))
      throw new Error(`Ayrshare API error: ${ayrshareResponse.status} - ${errorText}`)
    }

    const ayrshareData = await ayrshareResponse.json()
    console.log('Ayrshare response data:', JSON.stringify(ayrshareData, null, 2))

    if (!ayrshareData || ayrshareData.status === 'error') {
      const errorMsg = ayrshareData?.message || 'Failed to fetch profile data'
      console.error('Ayrshare returned error:', errorMsg)
      throw new Error(errorMsg)
    }

    if (!ayrshareData.success && ayrshareData.data) {
      // Some responses might not have success flag but still have data
      console.log('Response without success flag but has data, proceeding...')
    } else if (!ayrshareData.success) {
      throw new Error(ayrshareData.message || 'Failed to fetch profile data')
    }

    const profileData = ayrshareData.data || ayrshareData

    // Categorize influencer based on follower count
    const categorizeInfluencer = (followerCount: number): string => {
      if (followerCount >= 1000000) return 'Celebrity/Elite'
      if (followerCount >= 100001) return 'Macro'
      if (followerCount >= 50001) return 'Mid-Tier'
      if (followerCount >= 10001) return 'Micro'
      if (followerCount >= 1000) return 'Nano'
      return 'Emerging'
    }

    // Transform Ayrshare data to our format
    const transformedProfile = {
      username: profileData.username || cleanHandle,
      full_name: profileData.name || '',
      bio: profileData.bio || '',
      follower_count: profileData.followers || 0,
      following_count: profileData.following || 0,
      engagement_rate: profileData.engagementRate || 0,
      verified: profileData.verified || false,
      profile_picture_url: profileData.profilePicture || '',
      website: profileData.website || '',
      category: categorizeInfluencer(profileData.followers || 0),
      platform: platform || 'instagram',
      posts_count: profileData.posts || 0,
      avg_likes: profileData.avgLikes || 0,
      avg_comments: profileData.avgComments || 0,
      last_post_date: profileData.lastPostDate || null,
      account_type: profileData.accountType || 'personal',
      location: profileData.location || ''
    }

    // Store search in database
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      await supabase
        .from('social_media_searches')
        .insert({
          user_id: userData.user.id,
          platform: platform || 'instagram',
          username: cleanHandle
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: transformedProfile
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
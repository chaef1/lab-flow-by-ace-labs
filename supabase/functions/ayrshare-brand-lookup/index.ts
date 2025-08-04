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

    // Call Ayrshare brand lookup API for external profiles
    // Build query parameters based on platform
    const platformParam = platform || 'instagram'
    const params = new URLSearchParams()
    params.append('platforms[0]', platformParam)
    params.append(`${platformParam}User`, cleanHandle)
    
    const ayrshareUrl = `https://api.ayrshare.com/api/brand/byUser?${params.toString()}`
    
    console.log(`Making request to Ayrshare API for handle: ${cleanHandle}, platform: ${platformParam}`)
    console.log(`Request URL: ${ayrshareUrl}`)
    console.log(`Using API key prefix: ${ayrshareApiKey?.substring(0, 10)}...`)
    
    const ayrshareResponse = await fetch(ayrshareUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'User-Agent': 'Supabase-Edge-Function'
      }
    })

    console.log(`Ayrshare API response status: ${ayrshareResponse.status}`)

    if (!ayrshareResponse.ok) {
      const errorText = await ayrshareResponse.text()
      console.error('Ayrshare API error:', errorText)
      console.error('Request URL:', ayrshareUrl)
      console.error('Request headers:', {
        'Authorization': `Bearer ${ayrshareApiKey ? '[REDACTED]' : '[MISSING]'}`,
        'User-Agent': 'Supabase-Edge-Function'
      })
      throw new Error(`Ayrshare API error: ${ayrshareResponse.status} - ${errorText}`)
    }

    const ayrshareData = await ayrshareResponse.json()
    console.log('Ayrshare response data:', JSON.stringify(ayrshareData, null, 2))

    // Extract platform-specific data from the response
    const platformParam = platform || 'instagram'
    const platformData = ayrshareData[platformParam]
    
    if (!platformData) {
      throw new Error(`No data found for platform: ${platformParam}`)
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
        full_name: platformData.full_name || platformData.displayName || '',
        bio: platformData.biography || platformData.description || '',
        follower_count: platformData.followers_count || platformData.followersCount || 0,
        following_count: platformData.following_count || platformData.followingCount || 0,
        engagement_rate: platformData.engagement_rate || 0,
        verified: platformData.is_verified || platformData.verified || false,
        profile_picture_url: platformData.profile_pic_url || platformData.picture?.data?.url || '',
        website: platformData.external_url || platformData.website || '',
        category: categorizeInfluencer(platformData.followers_count || platformData.followersCount || 0),
        platform: platformParam,
        posts_count: platformData.media_count || platformData.posts || 0,
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: platformData.account_type || 'personal',
        location: ''
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
        location: platformData.location?.city || ''
      }
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
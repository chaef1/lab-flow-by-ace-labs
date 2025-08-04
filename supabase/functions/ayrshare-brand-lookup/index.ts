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

    // Note: Ayrshare doesn't have a public profile lookup API for external profiles
    // We'll need to use a different approach or service for external profile data
    // For now, let's create mock data to test the flow
    
    console.log(`Creating mock profile data for handle: ${cleanHandle}, platform: ${platform}`)
    
    // Mock response to test the integration flow
    const mockProfileData = {
      username: cleanHandle,
      name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
      bio: `Mock bio for ${cleanHandle}`,
      followers: Math.floor(Math.random() * 100000) + 1000,
      following: Math.floor(Math.random() * 1000) + 100,
      posts: Math.floor(Math.random() * 500) + 50,
      verified: Math.random() > 0.8,
      profilePicture: `https://via.placeholder.com/150?text=${cleanHandle.charAt(0).toUpperCase()}`,
      website: '',
      engagementRate: Math.random() * 10 + 1,
      avgLikes: Math.floor(Math.random() * 1000) + 100,
      avgComments: Math.floor(Math.random() * 100) + 10,
      accountType: 'personal',
      location: 'Unknown'
    }

    console.log('Mock profile data created:', JSON.stringify(mockProfileData, null, 2))

    // Use the mock data as our profile data
    const profileData = mockProfileData

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
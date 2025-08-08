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
    const { username, platform, searchType } = await req.json()

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Fetching profile for handle: ${username} on platform: ${platform}`)

    // Clean the handle - remove @ symbol and extract from URLs
    let cleanHandle = username.trim()
    
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

    const platformParam = platform || 'instagram'
    const params = new URLSearchParams()
    params.append('platforms[0]', platformParam)
    
    // Use correct parameter name based on platform
    switch (platformParam.toLowerCase()) {
      case 'instagram':
        params.append('instagramUser', cleanHandle)
        break
      case 'tiktok':
        params.append('tiktokUser', cleanHandle)
        break
      case 'facebook':
        params.append('facebookUser', cleanHandle)
        break
      case 'twitter':
      case 'x':
        params.append('twitterUser', cleanHandle)
        break
      default:
        params.append('instagramUser', cleanHandle) // Default to Instagram
    }
    
    const ayrshareUrl = `https://api.ayrshare.com/api/brand/byUser?${params.toString()}`
    
    // For TikTok, proceed directly with the brand lookup - Ayrshare will handle account verification
    if (platformParam === 'tiktok') {
      console.log('Proceeding with TikTok brand lookup via Ayrshare...')
    }

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
      
      // Handle specific TikTok errors
      if (platformParam === 'tiktok') {
        // For TikTok, try the business API endpoint instead
        const businessUrl = `https://api.ayrshare.com/api/business/byUser?platforms[0]=tiktok&tiktokUser=${cleanHandle}`
        console.log('Trying TikTok business endpoint:', businessUrl)
        
        const businessResponse = await fetch(businessUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ayrshareApiKey}`,
            'User-Agent': 'Supabase-Edge-Function'
          }
        })
        
        if (businessResponse.ok) {
          const businessData = await businessResponse.json()
          console.log('TikTok business API response:', JSON.stringify(businessData, null, 2))
          
          if (businessData.tiktok) {
            // Categorize influencer based on follower count
            const categorizeInfluencer = (followerCount: number): string => {
              if (followerCount >= 1000000) return 'Celebrity/Elite'
              if (followerCount >= 100001) return 'Macro'
              if (followerCount >= 50001) return 'Mid-Tier'
              if (followerCount >= 10001) return 'Micro'
              if (followerCount >= 1000) return 'Nano'
              return 'Emerging'
            }
            
            // Continue with business API data
            const ayrshareData = businessData
            const platformData = ayrshareData[platformParam]
            
            if (platformData) {
              const transformedProfile = {
                username: platformData.username || platformData.handle || cleanHandle,
                full_name: platformData.displayName || platformData.name || '',
                bio: platformData.description || platformData.biography || '',
                follower_count: platformData.followersCount || platformData.fans || 0,
                following_count: platformData.followingCount || platformData.following || 0,
                engagement_rate: 0,
                verified: platformData.verified || false,
                profile_picture_url: platformData.avatar || platformData.profilePictureUrl || '',
                website: platformData.website || '',
                category: categorizeInfluencer(platformData.followersCount || platformData.fans || 0),
                platform: platformParam,
                posts_count: platformData.videoCount || platformData.videos || 0,
                avg_likes: 0,
                avg_comments: 0,
                last_post_date: null,
                account_type: 'public',
                location: '',
                id: platformData.id
              }
              
              // Store search and return result
              const { data: userData } = await supabase.auth.getUser()
              if (userData?.user) {
                const { data: userProfile } = await supabase
                  .from('profiles')
                  .select('organization_id')
                  .eq('id', userData.user.id)
                  .single()
                
                await supabase
                  .from('social_media_searches')
                  .insert({
                    user_id: userData.user.id,
                    organization_id: userProfile?.organization_id,
                    platform: platform || 'tiktok',
                    username: cleanHandle
                  })
              }
              
              return new Response(
                JSON.stringify({
                  success: true,
                  profiles: [transformedProfile]
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200
                }
              )
            }
          }
        }
      }
      
      // Return a more user-friendly error for TikTok
      if (platformParam === 'tiktok') {
        return new Response(
          JSON.stringify({
            success: false,
            error: `TikTok profile search failed. This could be due to: 1) Account not connected in Ayrshare, 2) Profile is private, or 3) Username doesn't exist.`,
            platform_error: true,
            platform: 'tiktok'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
      
      throw new Error(`Ayrshare API error: ${ayrshareResponse.status} - ${errorText}`)
    }

    const ayrshareData = await ayrshareResponse.json()
    console.log('Ayrshare response data:', JSON.stringify(ayrshareData, null, 2))

    // Extract platform-specific data from the response
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
        full_name: platformData.name || '',
        bio: platformData.biography || '',
        follower_count: platformData.followersCount || 0,
        following_count: platformData.followsCount || 0,
        engagement_rate: 0, // Brand endpoint doesn't provide engagement data
        verified: false, // Brand endpoint doesn't provide verification status for Instagram
        profile_picture_url: platformData.profilePictureUrl || '',
        website: platformData.website || '',
        category: categorizeInfluencer(platformData.followersCount || 0),
        platform: platformParam,
        posts_count: platformData.mediaCount || 0,
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: 'public', // Brand endpoint only returns public accounts
        location: '',
        id: platformData.id,
        ig_id: platformData.igId
      }
    } else if (platformParam === 'tiktok') {
      transformedProfile = {
        username: platformData.username || platformData.handle || cleanHandle,
        full_name: platformData.displayName || platformData.name || '',
        bio: platformData.description || platformData.biography || '',
        follower_count: platformData.followersCount || platformData.fans || 0,
        following_count: platformData.followingCount || platformData.following || 0,
        engagement_rate: 0,
        verified: platformData.verified || false,
        profile_picture_url: platformData.avatar || platformData.profilePictureUrl || '',
        website: platformData.website || '',
        category: categorizeInfluencer(platformData.followersCount || platformData.fans || 0),
        platform: platformParam,
        posts_count: platformData.videoCount || platformData.videos || 0,
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: 'public',
        location: '',
        id: platformData.id
      }
    } else if (platformParam === 'facebook') {
      transformedProfile = {
        username: platformData.username || cleanHandle,
        full_name: platformData.name || '',
        bio: platformData.description || platformData.about || '',
        follower_count: platformData.followersCount || platformData.fanCount || 0,
        following_count: 0, // Facebook pages don't have following count
        engagement_rate: 0,
        verified: platformData.verificationStatus === 'blue_verified',
        profile_picture_url: platformData.picture?.data?.url || '',
        website: platformData.website || '',
        category: categorizeInfluencer(platformData.followersCount || platformData.fanCount || 0),
        platform: platformParam,
        posts_count: 0, // Not provided in brand endpoint
        avg_likes: 0,
        avg_comments: 0,
        last_post_date: null,
        account_type: 'public',
        location: platformData.location?.city || '',
        id: platformData.id
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

    // Store search in database with organization_id
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      // Get user's organization_id
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single()
      
      await supabase
        .from('social_media_searches')
        .insert({
          user_id: userData.user.id,
          organization_id: userProfile?.organization_id,
          platform: platform || 'instagram',
          username: cleanHandle
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        profiles: [transformedProfile]
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
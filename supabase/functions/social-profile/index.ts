
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders, formatResponse } from '../_shared/utils.ts'
import { fetchInstagramProfile } from './instagram.ts'
import { fetchTikTokProfile } from './tiktok.ts'

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const INSTAGRAM_APP_ID = Deno.env.get('INSTAGRAM_APP_ID') || ''
const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET') || ''

// Create a single Deno deploy function that can handle multiple platforms
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Handle OAuth callbacks if present in the URL
    const url = new URL(req.url);
    if (url.pathname.includes('/auth/callback')) {
      // This would be where we handle the OAuth callback
      // For now, we'll just return a message
      return formatResponse({
        message: "OAuth callback handling would happen here. This feature is not fully implemented yet."
      });
    }
    
    const { platform, username, code, accessToken } = await req.json()
    
    if (!platform || !username) {
      return formatResponse({
        error: 'Platform and username are required'
      }, 400)
    }
    
    if (platform !== 'instagram' && platform !== 'tiktok') {
      return formatResponse({
        error: 'Only Instagram and TikTok platforms are currently supported'
      }, 400)
    }
    
    // Clean the username - remove @ symbol and extract from URLs
    let cleanUsername = username.trim()
    if (cleanUsername.startsWith('@')) {
      cleanUsername = cleanUsername.substring(1)
    }
    
    // Extract username from social media URLs if provided
    const instagramUrlMatch = cleanUsername.match(/instagram\.com\/([^\/\?#]+)/)
    const tiktokUrlMatch = cleanUsername.match(/tiktok\.com\/@([^\/\?#]+)/)
    if (instagramUrlMatch) {
      cleanUsername = instagramUrlMatch[1]
    } else if (tiktokUrlMatch) {
      cleanUsername = tiktokUrlMatch[1]
    }
    
    console.log(`Fetching ${platform} profile for cleaned username: ${cleanUsername}`)
    
    let profile;
    
    try {
      if (platform === 'instagram') {
        profile = await fetchInstagramProfile(
          cleanUsername, 
          INSTAGRAM_APP_ID, 
          INSTAGRAM_APP_SECRET,
          accessToken
        )
      } else if (platform === 'tiktok') {
        profile = await fetchTikTokProfile(
          cleanUsername,
          accessToken
        )
      }
      
      if (!profile) {
        return formatResponse({
          error: `Failed to fetch ${platform} profile`
        }, 404)
      }
      
      return formatResponse({
        success: true,
        profile: {
          username: profile.username,
          fullName: profile.full_name,
          bio: profile.biography,
          followersCount: profile.follower_count,
          followingCount: profile.following_count,
          postsCount: profile.post_count,
          verified: profile.is_verified,
          profilePicture: profile.profile_pic_url,
          engagementRate: profile.engagement_rate,
          website: profile.website,
          recentPosts: profile.posts?.map((post: any) => ({
            url: post.url,
            type: post.type,
            thumbnail: post.thumbnail,
            likes: post.likes,
            comments: post.comments,
            caption: post.caption,
            postedAt: post.timestamp ? new Date(post.timestamp) : null
          })) || [],
          ...(profile.requires_auth && {
            requires_auth: true,
            auth_url: profile.auth_url
          }),
          ...(profile.is_mock_data && {
            is_mock_data: true
          })
        }
      })
    } catch (error) {
      console.error(`${platform} profile fetch error:`, error.message)
      
      if (error.message.includes('rate limit')) {
        return formatResponse({
          error: `${platform} rate limit reached. Please try again later.`,
          temporary_error: true
        }, 429)
      }
      
      return formatResponse({
        error: error.message || `Failed to fetch ${platform} profile`
      }, 500)
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return formatResponse(
      { error: error.message || 'Unknown error occurred' },
      500
    );
  }
})

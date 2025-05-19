
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
    const { platform, username } = await req.json()
    
    // Validate request parameters
    if (!platform || !username) {
      return formatResponse(
        { error: 'Platform and username are required' },
        400
      )
    }
    
    // Validate platform
    if (!['instagram', 'tiktok'].includes(platform)) {
      return formatResponse(
        { error: 'Platform must be instagram or tiktok' },
        400
      )
    }
    
    // Clean username (extract from URL if needed, remove @ if present)
    let cleanUsername = username.replace('@', '')
    
    // Extract username from Instagram URL if provided
    if (platform === 'instagram' && cleanUsername.includes('instagram.com')) {
      const urlRegex = /instagram\.com\/([^\/\?#]+)/
      const match = cleanUsername.match(urlRegex)
      if (match && match[1]) {
        cleanUsername = match[1].replace(/\/$/, '')
        console.log(`Extracted Instagram username from URL: ${cleanUsername}`)
      } else {
        return formatResponse(
          { error: 'Could not extract a valid Instagram username from the URL' },
          400
        )
      }
    }
    
    console.log(`Processing ${platform} profile for: ${cleanUsername}`)

    // Log API credentials status (without revealing the keys)
    if (platform === 'instagram') {
      if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
        console.error("Instagram API credentials are not properly set");
      } else {
        console.log(`Using Instagram API credentials - App ID available: ${INSTAGRAM_APP_ID.length > 0}, App Secret available: ${INSTAGRAM_APP_SECRET.length > 0}`);
      }
    }

    // Process the request based on platform
    try {
      let profileData;
      
      if (platform === 'instagram') {
        profileData = await fetchInstagramProfile(cleanUsername, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET);
      } else if (platform === 'tiktok') {
        // Use the configured API key 
        const tiktokApiKey = Deno.env.get('APIFY_SOCIALSCRAPER') || '';
        profileData = await fetchTikTokProfile(cleanUsername, tiktokApiKey);
        
        // Add a flag to indicate if the returned data is mock data
        // This helps the UI show appropriate messaging
        if (profileData && !profileData.is_mock_data && 
            (!profileData.follower_count || typeof profileData.is_verified !== 'boolean')) {
          profileData.is_mock_data = true;
        }
      }
      
      if (!profileData) {
        throw new Error(`${platform} profile not found for ${cleanUsername}`);
      }
      
      console.log(`Successfully retrieved ${platform} profile for: ${cleanUsername}`);
      return formatResponse(profileData);
    } catch (platformError) {
      console.error(`Error fetching ${platform} profile:`, platformError);
      return formatResponse(
        { error: platformError.message || `Error fetching ${platform} profile` },
        404
      );
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return formatResponse(
      { error: error.message || 'Unknown error occurred' },
      500
    );
  }
})

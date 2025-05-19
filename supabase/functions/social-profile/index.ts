
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders, formatResponse } from '../_shared/utils.ts'
import { fetchInstagramProfile } from './instagram.ts'
import { fetchTikTokProfile } from './tiktok.ts'

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

    // Validate API keys
    if (!APIFY_API_KEY && !Deno.env.get('TIKTOK_API_KEY')) {
      console.error('No API keys configured (APIFY_API_KEY or TIKTOK_API_KEY)')
      return formatResponse(
        { error: 'API integration not configured' },
        500
      )
    }
    
    // Clean username (remove @ if present)
    const cleanUsername = username.replace('@', '')
    console.log(`Processing ${platform} profile for: ${cleanUsername}`)

    // Process the request based on platform
    try {
      let profileData;
      
      if (platform === 'instagram') {
        profileData = await fetchInstagramProfile(cleanUsername, APIFY_API_KEY);
      } else if (platform === 'tiktok') {
        // Use the configured API key 
        const tiktokApiKey = Deno.env.get('APIFY_SOCIALSCRAPER') || APIFY_API_KEY;
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

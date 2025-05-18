
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

    // Process the request based on platform
    try {
      let profileData;
      
      if (platform === 'instagram') {
        profileData = await fetchInstagramProfile(username, APIFY_API_KEY);
      } else if (platform === 'tiktok') {
        profileData = await fetchTikTokProfile(username, APIFY_API_KEY);
      }
      
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

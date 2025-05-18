
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SOCIALSCRAPE_API_KEY = Deno.env.get('SOCIALSCRAPE_API_KEY') || ''

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

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Call SocialScrape API
    const apiUrl = `https://api.socialscrape.io/v1/${platform}/profile/${username}`
    
    console.log(`Fetching data from ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SOCIALSCRAPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SocialScrape API error: ${response.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ error: `Failed to fetch ${platform} data`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
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

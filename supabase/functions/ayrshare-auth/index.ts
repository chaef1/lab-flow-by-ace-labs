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
    const { action, ...requestData } = await req.json()

    console.log(`Ayrshare auth action: ${action}`)

    switch (action) {
      case 'get_auth_url':
        return await getAuthUrl(requestData)
      case 'get_profiles':
        return await getProfiles()
      case 'get_profile_status':
        return await getProfileStatus()
      case 'unlink_profile':
        return await unlinkProfile(requestData.profileKey)
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in ayrshare-auth:', error)
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

async function getAuthUrl(data: any) {
  const { platforms } = data
  
  console.log('Getting auth URL for platforms:', platforms)

  const ayrshareUrl = 'https://app.ayrshare.com/api/profiles/generateAuthURL'
  
  const requestBody = {
    platforms: platforms || ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']
  }

  const response = await fetch(ayrshareUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ayrshareApiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  const responseData = await response.json()
  console.log('Ayrshare auth URL response:', responseData)

  if (!response.ok) {
    throw new Error(`Ayrshare API error: ${response.status} - ${JSON.stringify(responseData)}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: responseData
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function getProfiles() {
  console.log('Getting connected profiles')

  const ayrshareUrl = 'https://app.ayrshare.com/api/profiles'
  
  const response = await fetch(ayrshareUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ayrshareApiKey}`
    }
  })

  const responseData = await response.json()
  console.log('Connected profiles response:', responseData)

  if (!response.ok) {
    throw new Error(`Ayrshare API error: ${response.status} - ${JSON.stringify(responseData)}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: responseData
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function getProfileStatus() {
  console.log('Getting profile status')

  const ayrshareUrl = 'https://app.ayrshare.com/api/user'
  
  const response = await fetch(ayrshareUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ayrshareApiKey}`
    }
  })

  const responseData = await response.json()
  console.log('Profile status response:', responseData)

  if (!response.ok) {
    throw new Error(`Ayrshare API error: ${response.status} - ${JSON.stringify(responseData)}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: responseData
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function unlinkProfile(profileKey: string) {
  console.log('Unlinking profile:', profileKey)

  const ayrshareUrl = 'https://app.ayrshare.com/api/profiles/unlink'
  
  const response = await fetch(ayrshareUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ayrshareApiKey}`
    },
    body: JSON.stringify({ profileKey })
  })

  const responseData = await response.json()
  console.log('Unlink profile response:', responseData)

  if (!response.ok) {
    throw new Error(`Ayrshare API error: ${response.status} - ${JSON.stringify(responseData)}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: responseData
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}
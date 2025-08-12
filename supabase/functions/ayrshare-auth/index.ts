import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')!
const ayrsharePrivateKey = Deno.env.get('AYRSHARE_PRIVATE_KEY')!
const ayrshareDomain = Deno.env.get('AYRSHARE_DOMAIN')!

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
      case 'create_profile':
        return await createProfile(requestData)
      case 'generate_jwt':
        return await generateJWT(requestData)
      case 'get_auth_url':
        return await getAuthUrl(requestData)
      case 'get_profiles':
        return await getProfiles(requestData.profileKey)
      case 'get_profile_status':
        return await getProfileStatus(requestData.profileKey)
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

async function createProfile(data: any) {
  const { supabase, userId, userName } = data
  
  console.log('Creating Ayrshare profile for user:', userId)

  const ayrshareUrl = 'https://api.ayrshare.com/api/profiles'
  
  const requestBody = {
    title: userName || `User ${userId}`,
    name: userName || `User ${userId}`
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
  console.log('Profile creation response:', responseData)

  if (!response.ok) {
    throw new Error(`Ayrshare API error: ${response.status} - ${JSON.stringify(responseData)}`)
  }

  // Store the profile key in our database
  if (responseData.profileKey && userId) {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    await supabaseClient
      .from('profiles')
      .update({ ayrshare_profile_key: responseData.profileKey })
      .eq('id', userId)
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

async function generateJWT(data: any) {
  const { profileKey } = data
  
  console.log('Generating JWT for profile:', profileKey)

  // Clean and format the private key properly
  let privateKey = ayrsharePrivateKey.trim()
  
  // Ensure proper line breaks if they're missing
  if (!privateKey.includes('\n')) {
    privateKey = privateKey
      .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN RSA PRIVATE KEY-----\n')
      .replace('-----END RSA PRIVATE KEY-----', '\n-----END RSA PRIVATE KEY-----')
      .replace(/(.{64})/g, '$1\n')
      .replace(/\n\n/g, '\n') // Remove double line breaks
  }

  const ayrshareUrl = 'https://api.ayrshare.com/api/profiles/generateJWT'
  
  const requestBody = {
    domain: ayrshareDomain,
    privateKey: privateKey,
    profileKey: profileKey
  }

  console.log('JWT request - Profile Key:', profileKey)
  console.log('JWT request - Domain:', ayrshareDomain)
  console.log('JWT request body (without private key):', { domain: ayrshareDomain, profileKey: profileKey })

  console.log('Private key format check:', {
    hasBeginMarker: privateKey.includes('-----BEGIN RSA PRIVATE KEY-----'),
    hasEndMarker: privateKey.includes('-----END RSA PRIVATE KEY-----'),
    hasLineBreaks: privateKey.includes('\n'),
    length: privateKey.length
  })

  const response = await fetch(ayrshareUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ayrshareApiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  const responseData = await response.json()
  console.log('JWT generation response:', responseData)

  if (!response.ok || responseData.status === 'error') {
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

async function getAuthUrl(data: any) {
  const { profileKey } = data
  
  console.log('Getting auth URL for profile:', profileKey)

  // First generate JWT
  const jwtResponse = await generateJWT({ profileKey })
  const jwtData = await jwtResponse.json()
  
  if (!jwtData.success) {
    throw new Error('Failed to generate JWT')
  }

  const jwt = jwtData.data.token || jwtData.data.jwt
  
  // Add cache-busting parameters to ensure fresh authentication
  const timestamp = Date.now()
  const randomParam = Math.random().toString(36).substring(7)
  const ssoUrl = `https://profile.ayrshare.com?domain=${ayrshareDomain}&jwt=${jwt}&t=${timestamp}&r=${randomParam}`

  console.log('Generated auth URL with cache busting for profile:', profileKey, 'URL:', ssoUrl)

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        url: ssoUrl,
        jwt: jwt,
        profileKey: profileKey, // Include profile key for debugging
        timestamp: timestamp
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function getProfiles(profileKey?: string) {
  console.log('Getting connected profiles for profile:', profileKey)

  const ayrshareUrl = 'https://api.ayrshare.com/api/profiles'
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${ayrshareApiKey}`
  }

  // Add profile key if provided
  if (profileKey) {
    headers['Profile-Key'] = profileKey
  }

  const response = await fetch(ayrshareUrl, {
    method: 'GET',
    headers
  })

  const responseData = await response.json()
  console.log('Connected profiles response:', responseData)

  if (!response.ok) {
    // Handle rate limiting gracefully
    if (response.status === 429 || responseData.code === 105) {
      throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.')
    }
    throw new Error(`Ayrshare API error: ${response.status} - ${JSON.stringify(responseData)}`)
  }

  // Transform the response to match our expected format
  const transformedData = {
    profiles: responseData.profiles?.map((profile: any) => ({
      platform: profile.platform || 'unknown',
      username: profile.username || profile.name || profile.title,
      profileKey: profileKey,
      status: profile.status || 'active',
      refId: profile.refId
    })) || []
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: transformedData
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}

async function getProfileStatus(profileKey?: string) {
  console.log('Getting profile status for profile:', profileKey)

  const ayrshareUrl = 'https://api.ayrshare.com/api/user'
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${ayrshareApiKey}`
  }

  if (profileKey) {
    headers['Profile-Key'] = profileKey
  }

  const response = await fetch(ayrshareUrl, {
    method: 'GET',
    headers
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

  const ayrshareUrl = 'https://api.ayrshare.com/api/profiles/unlink'
  
  const response = await fetch(ayrshareUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ayrshareApiKey}`,
      'Profile-Key': profileKey
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
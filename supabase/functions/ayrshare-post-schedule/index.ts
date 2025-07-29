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

    console.log(`Ayrshare action: ${action}`)

    switch (action) {
      case 'schedule_post':
        return await schedulePost(requestData)
      case 'get_scheduled_posts':
        return await getScheduledPosts()
      case 'delete_scheduled_post':
        return await deleteScheduledPost(requestData.postId)
      case 'get_analytics':
        return await getAnalytics(requestData)
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in ayrshare-post-schedule:', error)
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

async function schedulePost(data: any) {
  const { 
    post, 
    platforms, 
    scheduleDate, 
    mediaUrls, 
    shortenLinks,
    profileKey 
  } = data

  console.log('Scheduling post:', { post: post.substring(0, 50), platforms, scheduleDate })

  const ayrshareUrl = 'https://app.ayrshare.com/api/post'
  
  const requestBody: any = {
    post,
    platforms
  }

  // Add media if provided
  if (mediaUrls && mediaUrls.length > 0) {
    requestBody.mediaUrls = mediaUrls
  }

  // Add schedule date if provided
  if (scheduleDate) {
    requestBody.scheduleDate = scheduleDate
  }

  // Add link shortening option
  if (shortenLinks) {
    requestBody.shortenLinks = true
  }

  // Add profile key if provided (for multiple accounts)
  if (profileKey) {
    requestBody.profileKey = profileKey
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
  console.log('Ayrshare schedule response:', responseData)

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

async function getScheduledPosts() {
  console.log('Getting scheduled posts')

  const ayrshareUrl = 'https://app.ayrshare.com/api/post'
  
  const response = await fetch(ayrshareUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ayrshareApiKey}`
    }
  })

  const responseData = await response.json()
  console.log('Scheduled posts response:', responseData)

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

async function deleteScheduledPost(postId: string) {
  console.log('Deleting scheduled post:', postId)

  const ayrshareUrl = `https://app.ayrshare.com/api/post/${postId}`
  
  const response = await fetch(ayrshareUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${ayrshareApiKey}`
    }
  })

  const responseData = await response.json()
  console.log('Delete post response:', responseData)

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

async function getAnalytics(data: any) {
  const { platforms, startDate, endDate } = data
  
  console.log('Getting analytics:', { platforms, startDate, endDate })

  const ayrshareUrl = 'https://app.ayrshare.com/api/analytics/post'
  
  const params = new URLSearchParams()
  if (platforms) params.append('platforms', platforms.join(','))
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const response = await fetch(`${ayrshareUrl}?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ayrshareApiKey}`
    }
  })

  const responseData = await response.json()
  console.log('Analytics response:', responseData)

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
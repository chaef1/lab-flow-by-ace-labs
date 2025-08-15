import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  console.log('=== FUNCTION CALLED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing POST request')
    
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')
    console.log('API Key exists:', !!ayrshareApiKey)
    console.log('API Key length:', ayrshareApiKey?.length || 0)
    
    if (!ayrshareApiKey) {
      console.log('Returning API key error')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AYRSHARE_API_KEY not found',
          debug: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Returning success response')
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Function is working!',
        received: body,
        api_key_length: ayrshareApiKey.length,
        debug: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        debug: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
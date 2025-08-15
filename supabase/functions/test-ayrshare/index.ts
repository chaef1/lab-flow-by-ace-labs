const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('=== Test Function Started ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Testing Ayrshare API Connection ===');
    
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')
    
    console.log('API Key exists:', !!ayrshareApiKey);
    console.log('API Key length:', ayrshareApiKey?.length || 0);
    
    if (!ayrshareApiKey) {
      console.error('AYRSHARE_API_KEY environment variable is not set!');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AYRSHARE_API_KEY not configured',
          details: 'The API key environment variable is missing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Just return success for now to test basic function
    console.log('✅ Basic test successful!');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Basic function test successful',
        hasApiKey: !!ayrshareApiKey,
        apiKeyLength: ayrshareApiKey?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in test function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Test failed: ${error.message}`,
        details: error.stack,
        type: error.constructor.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
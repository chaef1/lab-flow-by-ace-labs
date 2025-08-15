const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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
          status: 500
        }
      )
    }

    // Test with a simple API call to get user info
    console.log('Making test request to Ayrshare API...');
    
    const testResponse = await fetch('https://app.ayrshare.com/api/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Ayrshare API response status:', testResponse.status);
    
    const responseData = await testResponse.text()
    console.log('Response data:', responseData);

    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      parsedData = { raw: responseData };
    }

    if (testResponse.ok) {
      console.log('✅ Ayrshare API connection successful!');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ayrshare API connection successful',
          status: testResponse.status,
          data: parsedData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      console.error('❌ Ayrshare API connection failed');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ayrshare API connection failed',
          status: testResponse.status,
          response: parsedData,
          details: 'API key may be invalid or expired'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

  } catch (error) {
    console.error('Error testing Ayrshare API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Test failed: ${error.message}`,
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
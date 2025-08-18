import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MODASH_API_TOKEN = Deno.env.get('MODASH_API_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== TESTING MODASH API ===');
    console.log('Token available:', !!MODASH_API_TOKEN);
    console.log('Token length:', MODASH_API_TOKEN?.length || 0);
    
    // First test: check status
    const statusResponse = await fetch('https://api.modash.io/v1/user/info', {
      headers: {
        'Authorization': `Bearer ${MODASH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Status response:', statusResponse.status);
    const statusData = statusResponse.ok ? await statusResponse.json() : await statusResponse.text();
    console.log('Status data:', statusData);
    
    // Test simple search
    const simplePayload = {
      pagination: { limit: 5, offset: 0 },
      sort: { field: 'followerCount', order: 'desc' },
      filter: {
        followerCount: { min: 10000, max: 1000000 }
      }
    };
    
    console.log('Testing Instagram search with payload:', JSON.stringify(simplePayload, null, 2));
    
    const searchResponse = await fetch('https://api.modash.io/v1/instagram/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODASH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePayload),
    });
    
    console.log('Search response status:', searchResponse.status);
    const searchData = searchResponse.ok ? await searchResponse.json() : await searchResponse.text();
    console.log('Search response:', JSON.stringify(searchData, null, 2));
    
    return new Response(JSON.stringify({
      status: 'test_complete',
      statusResponse: { status: statusResponse.status, data: statusData },
      searchResponse: { status: searchResponse.status, data: searchData }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'API test failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
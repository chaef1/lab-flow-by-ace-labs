import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AyrshareRequest {
  action: string;
  timeRange?: string;
  platform?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, timeRange = '30', platform = 'all' }: AyrshareRequest = await req.json();

    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY');
    if (!ayrshareApiKey) {
      throw new Error('AYRSHARE_API_KEY is not configured');
    }

    let endpoint: string;
    let requestBody: any = {};

    switch (action) {
      case 'account_insights':
        endpoint = 'https://app.ayrshare.com/api/analytics/post';
        requestBody = {
          platforms: platform === 'all' ? ['instagram', 'facebook', 'twitter', 'linkedin'] : [platform],
          timeRange: `last_${timeRange}_days`
        };
        break;
      
      case 'posts':
        endpoint = 'https://app.ayrshare.com/api/history';
        requestBody = {
          platform: platform === 'all' ? undefined : platform,
          limit: 50
        };
        break;
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    console.log(`Making Ayrshare API request to: ${endpoint}`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const ayrshareResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await ayrshareResponse.text();
    console.log(`Ayrshare API response status: ${ayrshareResponse.status}`);
    console.log('Ayrshare API response:', responseText);

    if (!ayrshareResponse.ok) {
      throw new Error(`Ayrshare API error: ${ayrshareResponse.status} - ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Ayrshare response:', parseError);
      throw new Error('Invalid JSON response from Ayrshare API');
    }

    // Transform the response for consistent format
    const transformedResponse = {
      success: true,
      data: responseData,
      action,
      timeRange,
      platform
    };

    return new Response(
      JSON.stringify(transformedResponse),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Ayrshare Analytics function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: 'Failed to fetch analytics data from Ayrshare'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
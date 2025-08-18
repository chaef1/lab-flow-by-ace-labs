import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MODASH_API_TOKEN = Deno.env.get('MODASH_API_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking Modash status with token:', MODASH_API_TOKEN ? 'Token present' : 'No token');
    
    // Test basic connectivity and authentication
    const userInfoResponse = await fetch('https://api.modash.io/v1/user/info', {
      headers: {
        'Authorization': `Bearer ${MODASH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('User info response status:', userInfoResponse.status);
    
    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : null;
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info error:', errorText);
    }

    // Determine if system is degraded based on authentication and credits
    const isAuthenticated = userInfoResponse.status === 200;
    const hasCredits = userInfo?.credits?.remaining > 10 || userInfo?.creditsRemaining > 10;
    const degraded = !isAuthenticated || !hasCredits;

    const response = {
      health: { status: isAuthenticated ? 'healthy' : 'degraded' },
      credits: userInfo?.credits || userInfo?.creditsRemaining || { remaining: 0, total: 0 },
      plan: userInfo?.plan || userInfo?.planName || 'unknown',
      limits: userInfo?.limits || {},
      degraded,
      authenticated: isAuthenticated,
      message: degraded 
        ? (!isAuthenticated ? 'Authentication failed - check API token' : 'Low credits remaining')
        : 'Service operational'
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        degraded: true,
        message: 'Unable to check Modash status'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
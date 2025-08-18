import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MODASH_API_TOKEN = Deno.env.get('MODASH_API_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch user info and health in parallel
    const [userInfoResponse, healthResponse] = await Promise.all([
      fetch('https://api.modash.io/v1/user/info', {
        headers: {
          'Authorization': `Bearer ${MODASH_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch('https://api.modash.io/v1/health', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : null;
    const health = healthResponse.ok ? await healthResponse.json() : null;

    // Determine if system is degraded
    const isHealthy = health?.status === 'healthy';
    const hasCredits = userInfo?.credits?.remaining > 10; // Threshold
    const degraded = !isHealthy || !hasCredits;

    const response = {
      health: health || { status: 'unknown' },
      credits: userInfo?.credits || { remaining: 0, total: 0 },
      plan: userInfo?.plan || 'unknown',
      limits: userInfo?.limits || {},
      degraded,
      message: degraded 
        ? (!isHealthy ? 'Modash service is experiencing issues' : 'Low credits remaining')
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
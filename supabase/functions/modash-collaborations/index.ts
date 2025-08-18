import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODASH_API_KEY = Deno.env.get('MODASH_API_TOKEN');
const MODASH_BASE_URL = 'https://api.modash.io/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, ...params } = await req.json();

    if (!type || !['posts', 'summary'].includes(type)) {
      throw new Error('Type must be either "posts" or "summary"');
    }

    console.log(`Fetching collaboration ${type} with params:`, JSON.stringify(params, null, 2));

    let endpoint = '';
    let method = 'POST';
    let body = JSON.stringify(params);

    if (type === 'posts') {
      endpoint = '/collaborations/posts';
    } else if (type === 'summary') {
      endpoint = '/collaborations/summary';
    }

    // Call Modash Collaborations API
    const response = await fetch(`${MODASH_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Modash Collaborations API error:`, errorData);
      throw new Error(errorData.message || `Modash API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched collaboration ${type} data`);

    return new Response(JSON.stringify({
      ...data,
      fetchedAt: new Date().toISOString(),
      type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Collaborations error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch collaboration data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
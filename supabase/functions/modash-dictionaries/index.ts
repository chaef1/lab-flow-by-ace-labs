import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODASH_API_KEY = Deno.env.get('MODASH_API_TOKEN');
const MODASH_BASE_URL = 'https://api.modash.io/v1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 3) {
      throw new Error('Invalid endpoint path');
    }

    const platform = pathParts[1]; // instagram, tiktok, youtube
    const action = pathParts[2]; // interests, locations, languages, brands, hashtags
    
    if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    console.log(`Fetching ${platform} ${action} dictionary with query: ${query}`);

    // Check cache first
    const cacheKey = `${platform}-${action}-${query}-${limit}`;
    const { data: cached } = await supabase
      .from('dictionaries')
      .select('*')
      .eq('kind', `${platform}_${action}`)
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (cached && cached.length > 0) {
      console.log(`Returning ${cached.length} cached results`);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Modash API
    const modashUrl = `${MODASH_BASE_URL}/${platform}/${action}?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(modashUrl, {
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Modash API error:`, errorData);
      throw new Error(errorData.message || `Modash API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.length || 0} dictionary entries`);

    // Cache results
    if (data && Array.isArray(data) && data.length > 0) {
      const cacheEntries = data.map((item: any) => ({
        kind: `${platform}_${action}`,
        entry_id: item.id?.toString() || item.name,
        name: item.name,
        meta: { 
          type: item.type,
          count: item.count,
          country: item.country,
          code: item.code,
          ...item 
        }
      }));

      try {
        await supabase
          .from('dictionaries')
          .upsert(cacheEntries, { onConflict: 'kind,entry_id' });
      } catch (cacheError) {
        console.warn('Failed to cache dictionary:', cacheError);
      }
    }

    // Log API usage
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: user.id,
            endpoint: `dictionary_${platform}_${action}`,
            platform,
            query_hash: cacheKey,
            credits_used: 0, // Dictionary calls are typically free
            response_cached: false
          });
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dictionary fetch error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch dictionary data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
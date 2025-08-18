import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceSupabase } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MODASH_API_TOKEN = Deno.env.get('MODASH_API_TOKEN');

interface DictionaryEntry {
  id: string;
  name: string;
  type?: string;
}

async function fetchFromModash(
  kind: string,
  query?: string,
  limit?: number
): Promise<DictionaryEntry[]> {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (limit) params.set('limit', limit.toString());
  
  const queryString = params.toString();
  const url = `https://api.modash.io/v1/dictionary/${kind}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${MODASH_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Modash API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { kind, query, limit } = body;

    if (!kind || !['location', 'interest', 'brand', 'language'].includes(kind)) {
      return new Response(
        JSON.stringify({ error: 'Invalid dictionary kind' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceSupabase();

    // Try to get from cache first (within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let cacheQuery = supabase
      .from('dictionaries')
      .select('entry_id, name, meta')
      .eq('kind', kind)
      .gte('updated_at', oneDayAgo);

    if (query) {
      cacheQuery = cacheQuery.ilike('name', `%${query}%`);
    }

    if (limit) {
      cacheQuery = cacheQuery.limit(limit);
    }

    const { data: cachedData, error: cacheError } = await cacheQuery;

    if (!cacheError && cachedData && cachedData.length > 0) {
      const formattedData = cachedData.map(item => ({
        id: item.entry_id,
        name: item.name,
        type: item.meta?.type || undefined
      }));

      return new Response(
        JSON.stringify(formattedData),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch from Modash if cache miss or stale
    const modashData = await fetchFromModash(kind, query, limit);

    // Update cache
    if (modashData.length > 0) {
      const cacheEntries = modashData.map(item => ({
        kind,
        entry_id: item.id,
        name: item.name,
        meta: item.type ? { type: item.type } : {},
        updated_at: new Date().toISOString()
      }));

      // Upsert entries
      await supabase
        .from('dictionaries')
        .upsert(cacheEntries, { 
          onConflict: 'kind,entry_id',
          ignoreDuplicates: false 
        });
    }

    return new Response(
      JSON.stringify(modashData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Dictionary error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceSupabase } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MODASH_API_TOKEN = Deno.env.get('MODASH_API_TOKEN');

interface ModashSearchPayload {
  pagination: { page: number };
  sort: { field: string; order: string };
  filters: {
    influencer: any;
    audience?: any;
  };
}

interface CreatorResult {
  platform: string;
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgViews: number;
  isVerified: boolean;
  topAudience: { country?: string; city?: string };
  matchBadges: string[];
  hasContactDetails: boolean;
}

function normalizeModashResponse(rawData: any): {
  results: CreatorResult[];
  lookalikes: CreatorResult[];
  total: number;
  exactMatch: boolean;
  estimatedCredits: number;
} {
  const results = (rawData.data || []).map((item: any) => ({
    platform: 'instagram',
    userId: item.userId || item.id,
    username: item.username || item.handle,
    fullName: item.fullName || item.name || '',
    profilePicUrl: item.picture || item.profilePic || '',
    followers: item.followers || 0,
    engagementRate: item.engagementRate || 0,
    avgLikes: item.avgLikes || 0,
    avgViews: item.avgViews || 0,
    isVerified: item.isVerified || false,
    topAudience: {
      country: item.audience?.geoCountries?.[0]?.name,
      city: item.audience?.geoCities?.[0]?.name,
    },
    matchBadges: generateMatchBadges(item),
    hasContactDetails: item.hasContactDetails || false,
  }));

  const lookalikes = (rawData.lookalikes || []).map((item: any) => ({
    platform: 'instagram',
    userId: item.userId || item.id,
    username: item.username || item.handle,
    fullName: item.fullName || item.name || '',
    profilePicUrl: item.picture || item.profilePic || '',
    followers: item.followers || 0,
    engagementRate: item.engagementRate || 0,
    avgLikes: item.avgLikes || 0,
    avgViews: item.avgViews || 0,
    isVerified: item.isVerified || false,
    topAudience: {
      country: item.audience?.geoCountries?.[0]?.name,
      city: item.audience?.geoCities?.[0]?.name,
    },
    matchBadges: generateMatchBadges(item),
    hasContactDetails: item.hasContactDetails || false,
  }));

  return {
    results,
    lookalikes,
    total: rawData.total || results.length,
    exactMatch: results.length > 0,
    estimatedCredits: rawData.estimatedCredits || 0.15,
  };
}

function generateMatchBadges(item: any): string[] {
  const badges = [];
  
  if (item.audience?.gender?.female > 50) {
    badges.push(`Female • ${Math.round(item.audience.gender.female)}%`);
  }
  
  if (item.audience?.geoCountries?.[0]) {
    const country = item.audience.geoCountries[0];
    badges.push(`${country.code} • ${Math.round(country.weight)}%`);
  }
  
  if (item.audience?.ages?.[0]) {
    const age = item.audience.ages[0];
    badges.push(`Age ${age.code} • ${Math.round(age.weight)}%`);
  }

  return badges;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getServiceSupabase();

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ModashSearchPayload = await req.json();

    // Call Modash API
    const modashResponse = await fetch('https://api.modash.io/v1/instagram/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODASH_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!modashResponse.ok) {
      throw new Error(`Modash API error: ${modashResponse.status}`);
    }

    const modashData = await modashResponse.json();
    const normalizedData = normalizeModashResponse(modashData);

    // Log search query
    await supabase.from('search_queries').insert({
      payload: payload,
      page: payload.pagination.page,
      results_count: normalizedData.results.length,
      estimated_credits: normalizedData.estimatedCredits,
      actual_credits: normalizedData.estimatedCredits, // Update when we get actual from Modash
      created_by: user.id,
    });

    // Cache creators in database
    if (normalizedData.results.length > 0) {
      const creatorsToCache = normalizedData.results.map(creator => ({
        platform: creator.platform,
        user_id: creator.userId,
        username: creator.username,
        full_name: creator.fullName,
        profile_pic_url: creator.profilePicUrl,
        followers: creator.followers,
        engagement_rate: creator.engagementRate,
        avg_likes: creator.avgLikes,
        avg_views: creator.avgViews,
        is_verified: creator.isVerified,
        top_audience_country: creator.topAudience.country,
        top_audience_city: creator.topAudience.city,
        has_contact_details: creator.hasContactDetails,
      }));

      await supabase
        .from('creators')
        .upsert(creatorsToCache, { 
          onConflict: 'platform,user_id',
          ignoreDuplicates: false 
        });
    }

    const response = {
      page: payload.pagination.page,
      pageSize: 15,
      total: normalizedData.total,
      results: normalizedData.results,
      lookalikes: normalizedData.lookalikes,
      meta: {
        exactMatch: normalizedData.exactMatch,
        estimatedCredits: normalizedData.estimatedCredits,
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
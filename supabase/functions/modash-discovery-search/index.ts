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
    const { platform, filters, sort, pagination } = await req.json();
    
    if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    console.log(`Searching ${platform} creators with filters:`, JSON.stringify(filters, null, 2));

    // Normalize filters for Modash API according to their docs
    const modashPayload = {
      page: pagination?.page || 0,
      calculationMethod: "median",
      sort: {
        field: sort?.field || 'followers',
        direction: sort?.direction || 'desc'
      },
      filter: filters
    };

    // Call Modash API
    const response = await fetch(`${MODASH_BASE_URL}/${platform}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modashPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Modash API error:`, errorData);
      throw new Error(errorData.message || `Modash API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.results?.length || 0} creators`);

    // Cache results in our database for faster subsequent access
    if (data.results && data.results.length > 0) {
      for (const creator of data.results) {
        try {
          await supabase
            .from('creators')
            .upsert({
              platform,
              user_id: creator.userId,
              username: creator.username,
              full_name: creator.fullName,
              profile_pic_url: creator.profilePicUrl,
              followers: creator.followers,
              engagement_rate: creator.engagementRate,
              avg_likes: creator.avgLikes,
              avg_views: creator.avgViews,
              is_verified: creator.isVerified,
              has_contact_details: creator.hasContactDetails,
              top_audience_country: creator.topAudience?.country,
              top_audience_city: creator.topAudience?.city,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'platform,user_id'
            });
        } catch (cacheError) {
          console.warn('Failed to cache creator:', cacheError);
        }
      }
    }

    // Get authenticated user for logging
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // Log search query
        await supabase
          .from('search_queries')
          .insert({
            payload: modashPayload,
            page: modashPayload.page,
            results_count: data.results?.length || 0,
            estimated_credits: data.meta?.estimatedCredits || 1,
            created_by: user.id
          });
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Discovery search error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to search creators'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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

    // Create proper Modash API payload
    const modashPayload = {
      pagination: {
        limit: 15,
        offset: (pagination?.page || 0) * 15
      },
      sort: {
        field: sort?.field === 'followers' ? 'followerCount' : sort?.field || 'followerCount',
        order: sort?.direction || 'desc'
      },
      filter: {
        // Basic filters
        followerCount: {
          min: filters.influencer?.followers?.min || 1000,
          max: filters.influencer?.followers?.max || 10000000
        },
        ...(filters.influencer?.engagementRate && {
          engagementRate: {
            min: filters.influencer.engagementRate.min,
            max: filters.influencer.engagementRate.max
          }
        }),
        ...(filters.influencer?.isVerified && { isVerified: true }),
        ...(filters.influencer?.hasContactDetails && { hasContactDetails: true }),
        ...(filters.influencer?.keywords && {
          keywords: [filters.influencer.keywords]
        }),
        ...(filters.influencer?.location?.countries?.length > 0 && {
          audienceGeo: {
            countries: filters.influencer.location.countries.map(c => ({ code: c, weight: 50 }))
          }
        }),
        ...(filters.influencer?.gender?.length > 0 && {
          audienceGender: {
            code: filters.influencer.gender[0],
            weight: 50
          }
        }),
        ...(filters.influencer?.language?.length > 0 && {
          audienceLanguage: filters.influencer.language.map(l => ({ code: l, weight: 50 }))
        })
      }
    };

    console.log('Modash API payload:', JSON.stringify(modashPayload, null, 2));

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
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Modash API error ${response.status}:`, errorText);
      
      // Check if it's an authentication error
      if (response.status === 401) {
        throw new Error('Invalid or expired Modash API token');
      } else if (response.status === 429) {
        throw new Error('Modash API rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error('Invalid search parameters. Please check your filters.');
      }
      
      throw new Error(`Modash API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Modash response:', JSON.stringify(data, null, 2));
    console.log(`Found ${data.data?.length || data.results?.length || 0} creators`);

    // Normalize the response to match our expected format
    const normalizedData = {
      results: (data.data || data.results || []).map((creator: any) => ({
        userId: creator.userId || creator.id || creator.user_id,
        username: creator.username || creator.handle,
        fullName: creator.fullName || creator.name || creator.full_name || '',
        profilePicUrl: creator.profilePicUrl || creator.picture || creator.profile_pic_url || '',
        followers: creator.followers || creator.followerCount || 0,
        engagementRate: creator.engagementRate || creator.engagement_rate || 0,
        avgLikes: creator.avgLikes || creator.avg_likes || 0,
        avgViews: creator.avgViews || creator.avg_views || 0,
        isVerified: creator.isVerified || creator.verified || false,
        hasContactDetails: creator.hasContactDetails || creator.contactDetails || false,
        topAudience: {
          country: creator.audience?.geoCountries?.[0]?.name || creator.topAudience?.country,
          city: creator.audience?.geoCities?.[0]?.name || creator.topAudience?.city
        },
        platform
      })),
      total: data.total || (data.data || data.results || []).length,
      page: pagination?.page || 0
    };

    // Cache results in our database for faster subsequent access
    if (normalizedData.results && normalizedData.results.length > 0) {
      for (const creator of normalizedData.results) {
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
            page: pagination?.page || 0,
            results_count: normalizedData.results?.length || 0,
            estimated_credits: data.meta?.estimatedCredits || data.credits_used || 1,
            created_by: user.id
          });
      }
    }

    return new Response(JSON.stringify(normalizedData), {
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
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODASH_API_KEY = Deno.env.get('MODASH_API_TOKEN');
const MODASH_BASE_URL = 'https://api.modash.io/v1';

console.log('MODASH_API_KEY available:', !!MODASH_API_KEY);
console.log('MODASH_API_KEY length:', MODASH_API_KEY?.length || 0);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== MODASH DISCOVERY SEARCH START ===');
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));
    
    // Handle both old and new request formats
    const platform = requestBody.platform;
    const filters = requestBody.filters || { influencer: requestBody.filter || {} };
    const sort = requestBody.sort;
    const pagination = requestBody.pagination || { page: requestBody.page || 0, limit: requestBody.limit || 15 };
    
    console.log('Normalized request:', JSON.stringify({ platform, filters, sort, pagination }, null, 2));
    
    if (!MODASH_API_KEY) {
      console.error('MODASH_API_TOKEN not found in environment');
      throw new Error('Modash API token not configured');
    }
    
    if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    console.log(`Searching ${platform} creators with filters:`, JSON.stringify(filters, null, 2));

    // Create proper Modash API payload according to documentation
    // Handle keywords from either nested or direct filter structure
    const searchKeywords = filters.influencer?.keywords?.trim() || filters.keywords?.trim() || requestBody.keywords?.trim();
    const isUsernameSearch = searchKeywords?.startsWith('@');
    const isHashtagSearch = searchKeywords?.startsWith('#');
    
    let modashPayload;
    
    if (isUsernameSearch && searchKeywords) {
      // For username searches, use simple direct matching
      const cleanUsername = searchKeywords.substring(1);
      modashPayload = {
        page: pagination?.page || 0,
        sort: {
          field: 'followers',
          direction: 'desc'
        },
        filter: {
          followers: { min: 100, max: 100000000 },
          engagementRate: { min: 0.001, max: 1 },
          // Try username field first
          username: cleanUsername
        }
      };
    } else if (!isHashtagSearch && searchKeywords) {
      // For general text searches, search in bio/text
      modashPayload = {
        page: pagination?.page || 0,
        sort: {
          field: 'followers',
          direction: 'desc'
        },
        filter: {
          followers: { min: 100, max: 50000000 },
          engagementRate: { min: 0.001, max: 1 },
          text: searchKeywords
        }
      };
    } else {
      // Standard search for non-username queries
      modashPayload = {
        page: pagination?.page || 0,
        sort: {
          field: sort?.field === 'followers' ? 'followers' : sort?.field || 'followers',
          direction: sort?.direction || 'desc'
        },
        filter: {
          // Apply user's filters or defaults - handle both nested and direct structure
          followers: {
            min: filters.influencer?.followers?.min || filters.followers?.min || requestBody.filter?.followers?.min || 1000,
            max: filters.influencer?.followers?.max || filters.followers?.max || requestBody.filter?.followers?.max || 10000000
          },
          ...((filters.influencer?.engagementRate || filters.engagementRate || requestBody.filter?.engagementRate) && {
            engagementRate: {
              min: filters.influencer?.engagementRate?.min || filters.engagementRate?.min || requestBody.filter?.engagementRate?.min || 0.001,
              max: filters.influencer?.engagementRate?.max || filters.engagementRate?.max || requestBody.filter?.engagementRate?.max || 0.15
            }
          }),
          ...(filters.influencer?.isVerified && { isVerified: true }),
          ...(filters.influencer?.hasContactDetails && { hasContactDetails: true }),
          // Handle different search types
          ...(searchKeywords && {
            ...(isHashtagSearch && {
              textTags: {
                hashtags: [searchKeywords.substring(1)] // Remove # symbol
              }
            }),
            ...(!isHashtagSearch && {
              text: searchKeywords
            })
          }),
          // Audience filters
          ...(filters.influencer?.location?.countries?.length > 0 && {
            audience: {
              geo: {
                countries: filters.influencer.location.countries.map(c => ({ id: c, weight: 0.3 }))
              }
            }
          }),
          ...(filters.influencer?.gender?.length > 0 && {
            audience: {
              gender: {
                code: filters.influencer.gender[0],
                weight: 0.3
              }
            }
          }),
          ...(filters.influencer?.language?.length > 0 && {
            audience: {
              languages: filters.influencer.language.map(l => ({ id: l, weight: 0.3 }))
            }
          })
        }
      };
    }

    console.log('Modash API payload:', JSON.stringify(modashPayload, null, 2));

    console.log('Making request to:', `${MODASH_BASE_URL}/${platform}/search`);
    console.log('Request headers:', {
      'Authorization': `Bearer ${MODASH_API_KEY?.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    });

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
        console.log('Rate limit exceeded for main search');
        return new Response(JSON.stringify({ 
          error: 'Modash API rate limit exceeded. Please try again later.',
          results: [],
          total: 0,
          rateLimited: true 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (response.status === 400) {
        throw new Error('Invalid search parameters. Please check your filters.');
      }
      
      throw new Error(`Modash API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Modash response:', JSON.stringify(data, null, 2));
    
    // Handle both direct matches and lookalikes from Modash response
    const allResults = [...(data.directs || []), ...(data.lookalikes || [])];
    console.log(`Found ${allResults.length} creators (${data.directs?.length || 0} direct, ${data.lookalikes?.length || 0} lookalikes)`);

    // Normalize the response to match our expected format
    const normalizedData = {
      results: allResults.map((creator: any) => {
        // Handle different response structures from Modash
        const profile = creator.profile || creator;
        return {
          userId: creator.userId || profile.userId || creator.id,
          username: profile.username || creator.username,
          fullName: profile.fullname || profile.fullName || profile.name || '',
          profilePicUrl: profile.picture || profile.profilePicUrl || '',
          followers: profile.followers || profile.followerCount || 0,
          engagementRate: profile.engagementRate || 0,
          avgLikes: profile.engagements || profile.avgLikes || 0,
          avgViews: profile.averageViews || profile.avgViews || 0,
          isVerified: profile.isVerified || false,
          hasContactDetails: profile.hasContactDetails || false,
          topAudience: {
            country: profile.audience?.geoCountries?.[0]?.name,
            city: profile.audience?.geoCities?.[0]?.name
          },
          platform,
          matchInfo: creator.matchInfo || null
        };
      }),
      total: data.total || allResults.length,
      page: pagination?.page || 0,
      isExactMatch: data.isExactMatch || false
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: 'Failed to search creators'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
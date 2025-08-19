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
    console.log('=== MODASH TEXT SEARCH START ===');
    const { platform, query, limit = 10 } = await req.json();
    
    console.log('Text search request:', { platform, query, limit });
    
    if (!MODASH_API_KEY) {
      throw new Error('Modash API token not configured');
    }
    
    if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchTerm = query.trim();
    const isUsernameSearch = searchTerm.startsWith('@');
    const isHashtagSearch = searchTerm.startsWith('#');

    console.log(`Performing ${platform} text search for: "${searchTerm}"`);
    console.log(`Search type: ${isUsernameSearch ? 'username' : isHashtagSearch ? 'hashtag' : 'general'}`);

    // Use the regular search endpoint with optimized params for text/username search
    const searchPayload = {
      page: 0,
      sort: {
        field: 'followers',
        direction: 'desc'
      },
      filter: {
        // Use very broad follower range to capture all potential matches
        followers: {
          min: 1,
          max: 1000000000
        },
        // Use broad engagement rate
        engagementRate: {
          min: 0,
          max: 1
        },
        // Add text search based on type
        ...(searchTerm && {
          ...(isUsernameSearch && {
            // For username search, search in bio/description text
            text: searchTerm.substring(1) // Remove @ symbol
          }),
          ...(isHashtagSearch && {
            // For hashtag search, use textTags
            textTags: {
              hashtags: [searchTerm.substring(1)] // Remove # symbol
            }
          }),
          ...(!isUsernameSearch && !isHashtagSearch && {
            // For general text search, search in bio
            text: searchTerm
          })
        })
      }
    };

    console.log('Search payload for suggestions:', JSON.stringify(searchPayload, null, 2));

    // Call Modash search API
    const response = await fetch(`${MODASH_BASE_URL}/${platform}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Modash search error ${response.status}:`, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Modash API token');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      // Return empty suggestions on error
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Text search response received, processing...');

    // Process results for autocomplete suggestions
    const suggestions = [];
    const allResults = [...(data.directs || []), ...(data.lookalikes || [])];

    for (const item of allResults.slice(0, limit)) {
      const profile = item.profile || item;
      
      suggestions.push({
        userId: item.userId || profile.userId || item.id,
        username: profile.username || item.username,
        fullName: profile.fullname || profile.fullName || profile.name || '',
        profilePicUrl: profile.picture || profile.profilePicUrl || '',
        followers: profile.followers || profile.followerCount || 0,
        isVerified: profile.isVerified || false,
        platform,
        matchType: isUsernameSearch ? 'username' : isHashtagSearch ? 'hashtag' : 'bio',
        relevanceScore: item.score || item.relevance || 1
      });
    }

    // Sort suggestions: exact username matches first, then by follower count
    suggestions.sort((a, b) => {
      if (isUsernameSearch) {
        const searchUsername = searchTerm.substring(1).toLowerCase();
        const aExactMatch = a.username?.toLowerCase() === searchUsername;
        const bExactMatch = b.username?.toLowerCase() === searchUsername;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Also check for partial matches at the beginning
        const aStartsWithMatch = a.username?.toLowerCase().startsWith(searchUsername);
        const bStartsWithMatch = b.username?.toLowerCase().startsWith(searchUsername);
        
        if (aStartsWithMatch && !bStartsWithMatch) return -1;
        if (!aStartsWithMatch && bStartsWithMatch) return 1;
      }
      
      // Then by follower count (descending)
      return b.followers - a.followers;
    });

    console.log(`Found ${suggestions.length} text search suggestions`);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Text search error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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

    if (!query || query.trim().length < 3) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchTerm = query.trim();
    const isUsernameSearch = searchTerm.startsWith('@');
    const isHashtagSearch = searchTerm.startsWith('#');

    console.log(`Performing ${platform} text search for: "${searchTerm}"`);
    console.log(`Search type: ${isUsernameSearch ? 'username' : isHashtagSearch ? 'hashtag' : 'general'}`);

    // Check if we have cached results to avoid hitting rate limits
    const cacheKey = `${platform}-${searchTerm.toLowerCase()}`;
    
    // Use different search strategies based on search type
    let searchPayload;
    
    if (isUsernameSearch) {
      const cleanUsername = searchTerm.substring(1); // Remove @ symbol
      // For username search, use exact username matching
      searchPayload = {
        page: 0,
        sort: {
          field: 'relevance', // Use relevance for username searches
          direction: 'desc'
        },
        filter: {
          // Very broad filters to capture any account
          followers: { min: 0, max: 1000000000 },
          engagementRate: { min: 0, max: 1 },
          // Search for exact username matches
          username: cleanUsername,
          // Also search in text as backup
          text: cleanUsername
        }
      };
    } else if (isHashtagSearch) {
      const cleanHashtag = searchTerm.substring(1); // Remove # symbol
      searchPayload = {
        page: 0,
        sort: { field: 'followers', direction: 'desc' },
        filter: {
          followers: { min: 1000, max: 1000000000 },
          engagementRate: { min: 0.01, max: 1 },
          textTags: { hashtags: [cleanHashtag] }
        }
      };
    } else {
      // General text search
      searchPayload = {
        page: 0,
        sort: { field: 'followers', direction: 'desc' },
        filter: {
          followers: { min: 1000, max: 1000000000 },
          engagementRate: { min: 0.01, max: 1 },
          text: searchTerm
        }
      };
    }

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
        console.log('Rate limit hit, returning empty suggestions gracefully');
        return new Response(JSON.stringify({ 
          suggestions: [], 
          error: 'Rate limit exceeded. Please try again in a moment.',
          rateLimited: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Return empty suggestions on other errors
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
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
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const feedType = url.searchParams.get('feedType');
    const identifier = url.searchParams.get('identifier'); // username, hashtag, etc.
    const limit = url.searchParams.get('limit') || '12';

    if (!platform || !feedType || !identifier) {
      throw new Error('Platform, feedType, and identifier are required');
    }

    if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    console.log(`Fetching ${platform} ${feedType} feed for ${identifier}`);

    let endpoint = '';
    
    // Map to Modash RAW API endpoints
    switch (platform) {
      case 'instagram':
        if (feedType === 'user-feed') {
          endpoint = `/raw/ig/user-feed?username=${identifier}&limit=${limit}`;
        } else if (feedType === 'hashtag-feed') {
          endpoint = `/raw/ig/hashtag-feed?hashtag=${identifier}&limit=${limit}`;
        } else if (feedType === 'user-info') {
          endpoint = `/raw/ig/user-info?username=${identifier}`;
        }
        break;
      case 'tiktok':
        if (feedType === 'user-feed') {
          endpoint = `/raw/tiktok/user-feed?username=${identifier}&limit=${limit}`;
        } else if (feedType === 'challenge-feed') {
          endpoint = `/raw/tiktok/challenge-feed?challenge=${identifier}&limit=${limit}`;
        }
        break;
      case 'youtube':
        if (feedType === 'channel-info') {
          endpoint = `/raw/youtube/channel-info?channel=${identifier}`;
        } else if (feedType === 'uploaded-videos') {
          endpoint = `/raw/youtube/uploaded-videos?channel=${identifier}&limit=${limit}`;
        } else if (feedType === 'video-info') {
          endpoint = `/raw/youtube/video-info?video=${identifier}`;
        }
        break;
    }

    if (!endpoint) {
      throw new Error('Invalid feedType for the specified platform');
    }

    // Call Modash RAW API
    const response = await fetch(`${MODASH_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Modash RAW API error:`, errorData);
      throw new Error(errorData.message || `Modash RAW API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.posts?.length || data.videos?.length || 1} items from RAW feed`);

    return new Response(JSON.stringify({
      ...data,
      fetchedAt: new Date().toISOString(),
      platform,
      feedType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAW feed error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch RAW feed data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
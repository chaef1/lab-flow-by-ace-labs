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
    const { platform, feedType, identifier, limit = 12, query, cursor, commentId } = await req.json();

    if (!platform || !feedType) {
      throw new Error('Platform and feedType are required');
    }

    if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    console.log(`Fetching ${platform} ${feedType} for ${identifier}`);

    let endpoint = '';
    
    // Map to Modash RAW API endpoints
    switch (platform) {
      case 'instagram':
        switch (feedType) {
          case 'search':
            endpoint = `/raw/ig/search?query=${encodeURIComponent(query || '')}&limit=${limit}`;
            break;
          case 'user-info':
            endpoint = `/raw/ig/user-info?username=${encodeURIComponent(identifier)}`;
            break;
          case 'user-feed':
            endpoint = `/raw/ig/user-feed?username=${encodeURIComponent(identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          case 'user-reels':
            endpoint = `/raw/ig/user-reels?username=${encodeURIComponent(identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          case 'user-tags-feed':
            endpoint = `/raw/ig/user-tags-feed?username=${encodeURIComponent(identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          case 'hashtag-feed':
            endpoint = `/raw/ig/hashtag-feed?hashtag=${encodeURIComponent(identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          case 'media-info':
            endpoint = `/raw/ig/media-info?shortcode=${encodeURIComponent(identifier)}`;
            break;
          case 'media-comments':
            endpoint = `/raw/ig/media-comments?shortcode=${encodeURIComponent(identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          case 'media-comment-replies':
            endpoint = `/raw/ig/media-comment-replies?comment_id=${encodeURIComponent(commentId || identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          case 'audio-info':
            endpoint = `/raw/ig/audio-info?audio_id=${encodeURIComponent(identifier)}&limit=${limit}`;
            if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
            break;
          default:
            throw new Error(`Invalid feedType '${feedType}' for Instagram`);
        }
        break;
      case 'tiktok':
        if (feedType === 'user-feed') {
          endpoint = `/raw/tiktok/user-feed?username=${encodeURIComponent(identifier)}&limit=${limit}`;
        } else if (feedType === 'challenge-feed') {
          endpoint = `/raw/tiktok/challenge-feed?challenge=${encodeURIComponent(identifier)}&limit=${limit}`;
        }
        break;
      case 'youtube':
        if (feedType === 'channel-info') {
          endpoint = `/raw/youtube/channel-info?channel=${encodeURIComponent(identifier)}`;
        } else if (feedType === 'uploaded-videos') {
          endpoint = `/raw/youtube/uploaded-videos?channel=${encodeURIComponent(identifier)}&limit=${limit}`;
        } else if (feedType === 'video-info') {
          endpoint = `/raw/youtube/video-info?video=${encodeURIComponent(identifier)}`;
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
      
      // Handle specific error types
      if (errorData.code === 'not_enough_credits') {
        throw new Error('Insufficient credits for RAW API access. Please upgrade your Modash plan.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      } else {
        throw new Error(errorData.message || `Modash RAW API returned ${response.status}`);
      }
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
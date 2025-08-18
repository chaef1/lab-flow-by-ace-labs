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
    const userId = url.searchParams.get('userId');
    const period = url.searchParams.get('period') || '30'; // days
    const postCount = url.searchParams.get('postCount') || '12';

    if (!platform || !userId) {
      throw new Error('Platform and userId are required');
    }

    if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    console.log(`Fetching ${platform} performance data for user ${userId}`);

    // Call Modash Performance Data API
    const response = await fetch(`${MODASH_BASE_URL}/${platform}/performance-data?userId=${userId}&period=${period}&limit=${postCount}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Modash Performance API error:`, errorData);
      throw new Error(errorData.message || `Modash API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched performance data with ${data.posts?.length || 0} posts`);

    // Enhance with aggregated metrics
    const enhancedData = {
      ...data,
      summary: generatePerformanceSummary(data.posts || []),
      fetchedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(enhancedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Performance data error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch performance data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generatePerformanceSummary(posts: any[]) {
  if (!posts || posts.length === 0) {
    return {
      avgLikes: 0,
      avgComments: 0,
      avgViews: 0,
      avgEngagementRate: 0,
      totalPosts: 0,
      topPost: null,
      recentTrend: 'stable'
    };
  }

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalEngagement = posts.reduce((sum, post) => sum + (post.engagementRate || 0), 0);

  const topPost = posts.reduce((max, post) => 
    (post.likes || 0) > (max.likes || 0) ? post : max, posts[0]);

  // Calculate trend (last 5 vs previous 5 posts)
  let recentTrend = 'stable';
  if (posts.length >= 10) {
    const recent = posts.slice(0, 5);
    const older = posts.slice(5, 10);
    const recentAvg = recent.reduce((sum, p) => sum + (p.likes || 0), 0) / 5;
    const olderAvg = older.reduce((sum, p) => sum + (p.likes || 0), 0) / 5;
    
    if (recentAvg > olderAvg * 1.1) recentTrend = 'increasing';
    else if (recentAvg < olderAvg * 0.9) recentTrend = 'decreasing';
  }

  return {
    avgLikes: Math.round(totalLikes / posts.length),
    avgComments: Math.round(totalComments / posts.length),
    avgViews: Math.round(totalViews / posts.length),
    avgEngagementRate: totalEngagement / posts.length,
    totalPosts: posts.length,
    topPost,
    recentTrend
  };
}
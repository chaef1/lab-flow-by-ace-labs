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
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const userId = url.searchParams.get('userId');
    const forceRefresh = url.searchParams.get('forceRefresh') === 'true';

    if (!platform || !userId) {
      throw new Error('Platform and userId are required');
    }

    if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    console.log(`Fetching ${platform} report for user ${userId}`);

    // Check cache first (30 days retention)
    let cachedReport = null;
    if (!forceRefresh) {
      const { data } = await supabase
        .from('cached_reports')
        .select('report_json, fetched_at')
        .eq('platform', platform)
        .eq('user_id', userId)
        .single();

      if (data) {
        const cacheAge = Date.now() - new Date(data.fetched_at).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        if (cacheAge < thirtyDays) {
          console.log('Returning cached report');
          cachedReport = data.report_json;
        }
      }
    }

    if (cachedReport) {
      return new Response(JSON.stringify(cachedReport), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from Modash API
    const response = await fetch(`${MODASH_BASE_URL}/${platform}/report/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MODASH_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Modash API error:`, errorData);
      throw new Error(errorData.message || `Modash API returned ${response.status}`);
    }

    const reportData = await response.json();
    console.log('Fetched fresh report from Modash');

    // Cache the report
    await supabase
      .from('cached_reports')
      .upsert({
        platform,
        user_id: userId,
        report_json: reportData,
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'platform,user_id'
      });

    // Compute Vetting Score
    const vettingScore = computeVettingScore(reportData);
    
    const enhancedReport = {
      ...reportData,
      vettingScore,
      cachedAt: new Date().toISOString()
    };

    return new Response(JSON.stringify(enhancedReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Creator report error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch creator report'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function computeVettingScore(report: any): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Engagement Rate (30%)
  const er = report.engagementRate || 0;
  if (er > 0.05) {
    score += 0.30;
    reasons.push("High engagement rate vs peers");
  } else if (er > 0.02) {
    score += 0.20;
  } else {
    reasons.push("Low engagement rate");
  }

  // Authenticity Score (20%) - based on follower growth pattern
  const growth = report.followerGrowth30d || 0;
  if (growth > 0 && growth < 50) {
    score += 0.20;
    reasons.push("Organic growth pattern");
  } else if (growth > 100) {
    reasons.push("Suspicious follower growth");
  }

  // Posting Consistency (15%)
  const postsPerWeek = report.postsPerWeek || 0;
  if (postsPerWeek >= 3 && postsPerWeek <= 7) {
    score += 0.15;
    reasons.push("Consistent posting cadence");
  } else if (postsPerWeek < 1) {
    reasons.push("Irregular posting schedule");
  }

  // Content Quality (15%) - proxy via avg likes/comments ratio
  const avgLikes = report.avgLikes || 0;
  const avgComments = report.avgComments || 0;
  const commentRatio = avgLikes > 0 ? avgComments / avgLikes : 0;
  if (commentRatio > 0.02) {
    score += 0.15;
    reasons.push("High audience engagement quality");
  } else if (commentRatio < 0.005) {
    reasons.push("Low comment engagement");
  }

  // Growth Velocity (10%)
  if (growth > 5 && growth < 20) {
    score += 0.10;
    reasons.push("Healthy growth velocity");
  }

  // Relevance Score (10%) - will be computed based on brand context
  score += 0.05; // baseline relevance

  return {
    score: Math.round(score * 100),
    reasons
  };
}
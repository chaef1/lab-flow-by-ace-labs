import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, query, pagination, limit, perPage } = await req.json();

    const page = pagination?.page ?? 0;
    const pageSize = limit ?? perPage ?? 20;

    console.log("=== CREATORS DB SEARCH START ===");
    console.log(
      "Request:",
      JSON.stringify({ platform, query, page, pageSize }, null, 2)
    );

    let q = supabase
      .from("creators")
      .select(
        `
        platform,
        user_id,
        username,
        full_name,
        profile_pic_url,
        followers,
        engagement_rate,
        avg_likes,
        avg_views,
        is_verified,
        has_contact_details,
        top_audience_country,
        top_audience_city
      `,
        { count: "exact" }
      );

    if (platform && ["instagram", "tiktok", "youtube"].includes(platform)) {
      q = q.eq("platform", platform);
    }

    const rawTerm = (query || "").toString().trim();
    if (rawTerm.length > 0) {
      const term = rawTerm.replace(/^[@#]/, "");
      q = q.or(`username.ilike.%${term}%,full_name.ilike.%${term}%`);
    }

    q = q.order("followers", { ascending: false, nullsFirst: false });

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await q.range(from, to);

    if (error) {
      console.error("DB search error:", error);
      throw new Error(error.message || "Failed to search creators database");
    }

    const results = (data || []).map((row: any) => ({
      userId: row.user_id,
      username: row.username,
      fullName: row.full_name || "",
      profilePicUrl: row.profile_pic_url || "",
      followers: row.followers || 0,
      engagementRate: row.engagement_rate || 0,
      avgLikes: row.avg_likes || 0,
      avgViews: row.avg_views || 0,
      isVerified: row.is_verified || false,
      hasContactDetails: row.has_contact_details || false,
      topAudience: {
        country: row.top_audience_country || null,
        city: row.top_audience_city || null,
      },
      platform: row.platform,
    }));

    console.log(`DB search returned ${results.length} results (count=${count})`);

    return new Response(
      JSON.stringify({ results, total: count ?? results.length, page }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Creators search error:", error);
    console.error("Error details:", {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      cause: (error as any)?.cause,
    });

    return new Response(
      JSON.stringify({
        error: (error as any)?.message || "Unknown error occurred",
        details: "Failed to search creators database",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

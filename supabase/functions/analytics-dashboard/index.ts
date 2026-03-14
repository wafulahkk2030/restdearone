import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    // Daily active users (posted story or comment today)
    const { count: dailyStories } = await supabase.from("stories").select("author_id", { count: "exact", head: true }).gte("created_at", todayStart);

    // New memorial pages this week
    const { count: newMemorials } = await supabase.from("memorial_pages").select("id", { count: "exact", head: true }).gte("created_at", weekAgo);

    // Total stories
    const { count: totalStories } = await supabase.from("stories").select("id", { count: "exact", head: true });

    // Total users
    const { count: totalUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true });

    // Total communities
    const { count: totalCommunities } = await supabase.from("community_groups").select("id", { count: "exact", head: true });

    // Revenue (completed payments)
    const { data: payments } = await supabase.from("payments").select("amount").eq("status", "completed");
    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    const { data: communityPayments } = await supabase.from("community_payments").select("amount").eq("status", "completed");
    const communityRevenue = communityPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Active memorials
    const { count: activeMemorials } = await supabase.from("memorial_pages").select("id", { count: "exact", head: true }).eq("status", "active");

    // Stories this week
    const { count: weeklyStories } = await supabase.from("stories").select("id", { count: "exact", head: true }).gte("created_at", weekAgo);

    // Top communities by member count
    const { data: topCommunities } = await supabase.from("community_groups").select("id, name, member_count, story_count").order("member_count", { ascending: false }).limit(5);

    return new Response(JSON.stringify({
      daily_active: dailyStories || 0,
      weekly_memorials: newMemorials || 0,
      total_stories: totalStories || 0,
      total_users: totalUsers || 0,
      total_communities: totalCommunities || 0,
      active_memorials: activeMemorials || 0,
      weekly_stories: weeklyStories || 0,
      revenue: { memorials: totalRevenue, communities: communityRevenue, total: totalRevenue + communityRevenue },
      top_communities: topCommunities || [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

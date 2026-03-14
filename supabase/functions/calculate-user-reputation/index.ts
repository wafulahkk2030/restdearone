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
    const { user_id } = await req.json();

    // Stories posted
    const { count: storiesCount } = await supabase.from("stories").select("id", { count: "exact", head: true }).eq("author_id", user_id);

    // Reactions received
    const { data: userStories } = await supabase.from("stories").select("id").eq("author_id", user_id);
    const storyIds = userStories?.map(s => s.id) || [];
    let reactionsCount = 0;
    if (storyIds.length > 0) {
      const { count } = await supabase.from("story_reactions").select("id", { count: "exact", head: true }).in("story_id", storyIds);
      reactionsCount = count || 0;
    }

    // Reports against user
    const { count: reportsCount } = await supabase.from("reports").select("id", { count: "exact", head: true }).eq("content_id", user_id).eq("content_type", "user");

    // Communities joined
    const { count: communitiesCount } = await supabase.from("community_members").select("id", { count: "exact", head: true }).eq("user_id", user_id);

    const score = Math.max(0,
      (storiesCount || 0) * 10 +
      reactionsCount * 5 +
      (communitiesCount || 0) * 3 -
      (reportsCount || 0) * 20
    );

    const tier = score >= 100 ? "Memory Keeper" : score >= 50 ? "Active Contributor" : score >= 10 ? "Storyteller" : "New Member";

    return new Response(JSON.stringify({ score, tier, stats: { stories: storiesCount || 0, reactions: reactionsCount, communities: communitiesCount || 0 } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

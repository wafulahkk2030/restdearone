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
    const { user_id, action_type } = await req.json();

    // Check rate limits
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    // Abuse-only thresholds: high enough that normal users are never blocked,
    // only triggered by automated/attack-like behavior.
    if (action_type === "story") {
      const { count } = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user_id)
        .gte("created_at", oneHourAgo);

      if ((count || 0) >= 200) {
        return new Response(JSON.stringify({ blocked: true, reason: "Unusual activity detected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (action_type === "comment") {
      const { count } = await supabase
        .from("story_comments")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user_id)
        .gte("created_at", oneHourAgo);

      if ((count || 0) >= 500) {
        return new Response(JSON.stringify({ blocked: true, reason: "Unusual activity detected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ blocked: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

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

    // Get user's communities
    const { data: memberships } = await supabase.from("community_members").select("community_id").eq("user_id", user_id);
    const communityIds = memberships?.map(m => m.community_id) || [];

    // Get user's followed memorials
    const { data: follows } = await supabase.from("memorial_followers").select("memorial_id").eq("user_id", user_id);
    const memorialIds = follows?.map(f => f.memorial_id) || [];

    let stories: any[] = [];

    // Stories from followed memorials
    if (memorialIds.length > 0) {
      const { data } = await supabase.from("stories").select("*").in("memorial_id", memorialIds).order("created_at", { ascending: false }).limit(10);
      stories.push(...(data || []));
    }

    // Stories from communities
    if (communityIds.length > 0) {
      const { data } = await supabase.from("community_stories").select("*").in("community_id", communityIds).order("created_at", { ascending: false }).limit(10);
      stories.push(...(data || []));
    }

    // Fill with recent stories if needed
    if (stories.length < 10) {
      const { data } = await supabase.from("stories").select("*").order("created_at", { ascending: false }).limit(10 - stories.length);
      stories.push(...(data || []));
    }

    return new Response(JSON.stringify({ stories }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { story_content } = await req.json();

    // Get all communities
    const { data: communities } = await supabase.from("community_groups").select("id, name, category, description").eq("is_active", true);
    if (!communities || communities.length === 0) {
      return new Response(JSON.stringify({ recommended: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const communityList = communities.map(c => `${c.id}|${c.name}|${c.category}`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Given a story and a list of communities (id|name|category), return the IDs of up to 3 most relevant communities as a JSON array of strings. Return ONLY the JSON array." },
          { role: "user", content: `Story: ${story_content.substring(0, 500)}\n\nCommunities:\n${communityList}` },
        ],
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || "[]";
    let ids;
    try { ids = JSON.parse(content); } catch { ids = []; }

    const recommended = communities.filter(c => ids.includes(c.id));
    return new Response(JSON.stringify({ recommended }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

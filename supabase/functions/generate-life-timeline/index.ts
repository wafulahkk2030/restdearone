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

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { memorial_id } = await req.json();

    const { data: memorial } = await supabase.from("memorial_pages").select("*").eq("id", memorial_id).single();
    if (!memorial) throw new Error("Memorial not found");

    const { data: stories } = await supabase.from("stories").select("title, content, story_type").eq("memorial_id", memorial_id).order("created_at");

    if (!stories || stories.length < 3) {
      return new Response(JSON.stringify({ timeline: null, reason: "Need at least 3 stories" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const storiesText = stories.map(s => `[${s.story_type}] ${s.title}: ${s.content}`).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You reconstruct a life timeline from memorial stories. Return a JSON array of timeline entries. Each entry has "period" (e.g. "Early Life", "Career", "Family", "Legacy"), "title" (short), and "description" (1-2 sentences). Create 3-6 entries. Return ONLY valid JSON array, no markdown.` },
          { role: "user", content: `Person: ${memorial.full_name} (${memorial.birth_year}-${memorial.death_year})\nPersonality: ${memorial.personality_summary || ""}\n\nStories:\n${storiesText}` },
        ],
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || "[]";

    let timeline;
    try { timeline = JSON.parse(content); } catch { timeline = []; }

    return new Response(JSON.stringify({ timeline }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

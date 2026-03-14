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

    const { data: memorial } = await supabase
      .from("memorial_pages")
      .select("id, full_name, death_year, personality_summary")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!memorial || memorial.length === 0) {
      return new Response(JSON.stringify({ memorial: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const random = memorial[Math.floor(Math.random() * memorial.length)];

    const { data: stories } = await supabase
      .from("stories")
      .select("id, title, content, story_type")
      .eq("memorial_id", random.id)
      .limit(3);

    return new Response(JSON.stringify({ memorial: random, stories: stories || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

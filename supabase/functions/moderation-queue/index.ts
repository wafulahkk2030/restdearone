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

    // Flagged content
    const { data: flags } = await supabase.from("content_flags").select("*").eq("reviewed", false).order("created_at", { ascending: false }).limit(50);

    // Pending reports
    const { data: reports } = await supabase.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50);

    return new Response(JSON.stringify({ flags: flags || [], reports: reports || [], total: (flags?.length || 0) + (reports?.length || 0) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

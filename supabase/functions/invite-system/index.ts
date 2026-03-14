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
    const { code, created_by, memorial_id, community_id } = await req.json();

    if (code) {
      // Look up invite
      const { data: invite } = await supabase.from("invites").select("*").eq("code", code).single();
      if (!invite) {
        return new Response(JSON.stringify({ error: "Invalid invite code" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("invites").update({ uses: invite.uses + 1 }).eq("id", invite.id);
      return new Response(JSON.stringify({ invite }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate invite
    const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase();
    const { data, error } = await supabase.from("invites").insert({
      code: inviteCode,
      created_by,
      memorial_id: memorial_id || null,
      community_id: community_id || null,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ invite: data, url: `https://restdearone.com/invite/${inviteCode}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

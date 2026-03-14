import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Find expired active memorial pages
  const { data: expired } = await supabase
    .from("memorial_pages")
    .select("id, created_by, full_name")
    .eq("status", "active")
    .lt("activation_expiry", new Date().toISOString());

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ message: "No expired pages", count: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  for (const page of expired) {
    await supabase.from("memorial_pages").update({ status: "inactive" }).eq("id", page.id);
    await supabase.from("notifications").insert({
      user_id: page.created_by,
      message: `The memorial page for ${page.full_name} has expired. Renew it to keep receiving memory prompts.`,
      link: `/memorial/${page.id}`,
    });
  }

  return new Response(JSON.stringify({ message: "Expired pages processed", count: expired.length }), { headers: { "Content-Type": "application/json" } });
});

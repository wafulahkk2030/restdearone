import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Get all memorial pages and check death_year anniversaries
  // Since we only store death_year, we check created_at month/day as approximate anniversary
  const { data: memorials } = await supabase
    .from("memorial_pages")
    .select("id, full_name, death_year, created_by");

  if (!memorials) return new Response(JSON.stringify({ count: 0 }), { headers: { "Content-Type": "application/json" } });

  let notified = 0;
  for (const memorial of memorials) {
    const yearsSince = today.getFullYear() - memorial.death_year;
    if (yearsSince <= 0) continue;

    // Get followers
    const { data: followers } = await supabase
      .from("memorial_followers")
      .select("user_id")
      .eq("memorial_id", memorial.id);

    const userIds = [memorial.created_by, ...(followers?.map(f => f.user_id) || [])];
    const unique = [...new Set(userIds)];

    for (const uid of unique) {
      await supabase.from("notifications").insert({
        user_id: uid,
        message: `Today marks ${yearsSince} year${yearsSince > 1 ? "s" : ""} since ${memorial.full_name} passed away. Would you like to share a memory?`,
        link: `/memorial/${memorial.id}`,
      });
      notified++;
    }
  }

  return new Response(JSON.stringify({ message: "Anniversary reminders sent", count: notified }), { headers: { "Content-Type": "application/json" } });
});

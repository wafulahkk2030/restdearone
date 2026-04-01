import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Find fundraisers ending in ~2 days that are still active
    const { data: ending } = await supabase.from("fundraisers")
      .select("*, profiles:created_by(display_name, username, email)")
      .eq("status", "active")
      .lte("deadline", twoDaysLater.toISOString())
      .gte("deadline", now.toISOString());

    for (const f of (ending || [])) {
      // Get admin user IDs
      const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["super_admin", "platform_admin"]);

      // Calculate totals from DB (source of truth)
      const { data: contribs } = await supabase.from("contributions")
        .select("net_amount, platform_fee")
        .eq("fundraiser_id", f.id)
        .eq("payment_status", "success");

      const totalNet = (contribs || []).reduce((s: number, c: any) => s + c.net_amount, 0);
      const totalFee = (contribs || []).reduce((s: number, c: any) => s + c.platform_fee, 0);
      const beneficiaryName = f.profiles?.display_name || f.profiles?.username || "Unknown";
      const payoutInfo = f.payout_method ? `${f.payout_method.toUpperCase()}: ${f.payout_account}` : "Not provided yet";

      // Notify admins
      for (const admin of (admins || [])) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          message: `Fundraiser "${f.title}" ends in 2 days. Prepare payout of KES ${totalNet.toLocaleString()} to ${beneficiaryName} (${payoutInfo}). Platform fee: KES ${totalFee.toLocaleString()}.`,
          link: `/fundraise/${f.id}`,
        });
      }

      // Notify fundraiser creator
      await supabase.from("notifications").insert({
        user_id: f.created_by,
        message: `Your fundraiser "${f.title}" ends in 2 days. Please confirm your payout details.`,
        link: `/fundraise/${f.id}`,
      });
    }

    // Lock expired fundraisers
    const { data: expired } = await supabase.from("fundraisers")
      .select("id, title, created_by")
      .eq("status", "active")
      .lt("deadline", now.toISOString());

    for (const f of (expired || [])) {
      await supabase.from("fundraisers").update({ status: "closed" }).eq("id", f.id);

      // Notify admins about payout readiness
      const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["super_admin", "platform_admin"]);
      const { data: contribs } = await supabase.from("contributions")
        .select("net_amount")
        .eq("fundraiser_id", f.id)
        .eq("payment_status", "success");
      const totalNet = (contribs || []).reduce((s: number, c: any) => s + c.net_amount, 0);

      for (const admin of (admins || [])) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          message: `Fundraiser "${f.title}" has ended. Payout of KES ${totalNet.toLocaleString()} is ready.`,
          link: `/fundraise/${f.id}`,
        });
      }

      await supabase.from("notifications").insert({
        user_id: f.created_by,
        message: `Your fundraiser "${f.title}" has ended. Payment processing will begin shortly.`,
        link: `/fundraise/${f.id}`,
      });
    }

    return new Response(JSON.stringify({ processed: (ending?.length || 0) + (expired?.length || 0) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payout manager error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

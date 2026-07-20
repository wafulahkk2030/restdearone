import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Actions: ban, unban, delete, force_signout, reset_password_email
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isTopAdmin = (roles || []).some((r: any) => ["super_admin", "platform_admin"].includes(r.role));
    if (!isTopAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, target_user_id, duration_hours } = await req.json();
    if (!action || !target_user_id) {
      return new Response(JSON.stringify({ error: "Missing action or target_user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: any = {};
    if (action === "ban") {
      const hours = duration_hours && duration_hours > 0 ? `${duration_hours}h` : "876000h"; // ~100y
      const { data, error } = await admin.auth.admin.updateUserById(target_user_id, { ban_duration: hours } as any);
      if (error) throw error;
      result = data;
    } else if (action === "unban") {
      const { data, error } = await admin.auth.admin.updateUserById(target_user_id, { ban_duration: "none" } as any);
      if (error) throw error;
      result = data;
    } else if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(target_user_id);
      if (error) throw error;
      result = { deleted: true };
    } else if (action === "force_signout") {
      const { error } = await admin.auth.admin.signOut(target_user_id as any).catch(() => ({ error: null } as any));
      if (error) throw error;
      result = { signed_out: true };
    } else if (action === "reset_password_email") {
      // Fetch email
      const { data: u } = await admin.auth.admin.getUserById(target_user_id);
      if (!u?.user?.email) throw new Error("User has no email");
      const { error } = await admin.auth.resetPasswordForEmail(u.user.email);
      if (error) throw error;
      result = { sent: true };
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("admin_activity_logs").insert({
      admin_id: userData.user.id,
      action: `admin_${action}`,
      target_type: "user",
      target_id: target_user_id,
      details: { duration_hours },
    });

    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
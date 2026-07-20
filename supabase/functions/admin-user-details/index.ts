import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("perPage") || "100"), 200);

    // List auth users (paginated)
    const { data: authList, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) throw listErr;

    const userIds = authList.users.map((u: any) => u.id);

    // Enrich with profile + role + suspension counts
    const [profRes, roleRes, susRes, warnRes] = await Promise.all([
      admin.from("profiles").select("id, username, display_name, email, country, city, created_at").in("id", userIds),
      admin.from("user_roles").select("user_id, role").in("user_id", userIds),
      admin.from("user_suspensions").select("user_id, reason, suspension_end_date, created_at").in("user_id", userIds),
      admin.from("user_warnings").select("user_id").in("user_id", userIds),
    ]);

    const profileMap = new Map((profRes.data || []).map((p: any) => [p.id, p]));
    const roleMap = new Map((roleRes.data || []).map((r: any) => [r.user_id, r.role]));
    const susMap = new Map((susRes.data || []).map((s: any) => [s.user_id, s]));
    const warnCounts = new Map<string, number>();
    (warnRes.data || []).forEach((w: any) => warnCounts.set(w.user_id, (warnCounts.get(w.user_id) || 0) + 1));

    const users = authList.users.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      phone: u.phone,
      banned_until: u.banned_until,
      is_anonymous: u.is_anonymous,
      provider: u.app_metadata?.provider,
      profile: profileMap.get(u.id) || null,
      role: roleMap.get(u.id) || null,
      suspension: susMap.get(u.id) || null,
      warnings: warnCounts.get(u.id) || 0,
    }));

    return new Response(JSON.stringify({ users, total: authList.total ?? users.length, page, perPage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const tally = (rows: any[], key: string, limit = 10) => {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = (r[key] ?? "unknown") as string;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roles || []).some((r: any) => ["super_admin", "platform_admin"].includes(r.role));
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const days = Math.min(Math.max(Number(body?.days) || 30, 1), 90);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: views, error } = await supabase
      .from("page_views")
      .select("path, page_title, referrer_source, utm_campaign, session_id, user_id, device_type, browser, language, timezone, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) return json({ error: error.message }, 500);

    const rows = views || [];
    const sessions = new Set(rows.map((r: any) => r.session_id).filter(Boolean));
    const signedIn = rows.filter((r: any) => r.user_id);
    const knownUsers = new Set(signedIn.map((r: any) => r.user_id));

    const byDayMap = new Map<string, number>();
    for (const r of rows) {
      const d = String(r.created_at).slice(0, 10);
      byDayMap.set(d, (byDayMap.get(d) || 0) + 1);
    }
    const by_day = [...byDayMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

    const hourMap = new Map<number, number>();
    for (const r of rows) {
      const h = new Date(r.created_at).getUTCHours();
      hourMap.set(h, (hourMap.get(h) || 0) + 1);
    }
    const by_hour = [...Array(24).keys()].map((h) => ({ hour: h, count: hourMap.get(h) || 0 }));

    const summary = {
      days,
      total_views: rows.length,
      unique_sessions: sessions.size,
      signed_in_views: signedIn.length,
      known_users: knownUsers.size,
      anonymous_share: rows.length ? Math.round(((rows.length - signedIn.length) / rows.length) * 100) : 0,
      views_per_session: sessions.size ? Number((rows.length / sessions.size).toFixed(2)) : 0,
    };

    const payload = {
      summary,
      by_day,
      by_hour,
      top_pages: tally(rows, "path", 12),
      top_referrers: tally(rows, "referrer_source", 10),
      campaigns: tally(rows.filter((r: any) => r.utm_campaign), "utm_campaign", 8),
      devices: tally(rows, "device_type", 5),
      browsers: tally(rows, "browser", 6),
      languages: tally(rows, "language", 6),
      timezones: tally(rows, "timezone", 8),
      recommendations: [] as string[],
    };

    if (body?.with_recommendations !== false && rows.length > 0) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        const prompt = `You analyse traffic for RestDearOne, a memorial storytelling platform in Kenya.
Data for the last ${days} days:
${JSON.stringify({ summary, top_pages: payload.top_pages, top_referrers: payload.top_referrers, devices: payload.devices, timezones: payload.timezones, by_hour: payload.by_hour })}
Explain the WHY behind the numbers and give 5 short, concrete recommendations. Return strict JSON: {"recommendations": ["...", "..."]}. No markdown.`;
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a pragmatic web analytics advisor. Reply with JSON only." },
                { role: "user", content: prompt },
              ],
            }),
          });
          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            const text = aiJson?.choices?.[0]?.message?.content ?? "";
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (Array.isArray(parsed.recommendations)) payload.recommendations = parsed.recommendations.slice(0, 6);
            }
          } else {
            console.error(`AI gateway failed [${aiRes.status}]: ${await aiRes.text()}`);
          }
        } catch (e) {
          console.error("AI recommendation error", e);
        }
      }
    }

    return json(payload);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});

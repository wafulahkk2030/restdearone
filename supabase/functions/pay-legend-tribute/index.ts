import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  legend_id: z.string().uuid(),
  contributor_name: z.string().min(1).max(120),
  contributor_email: z.string().email(),
  amount: z.number().int().positive(),
  message: z.string().max(2000).optional().nullable(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY not configured");

    // Optional auth — guests may contribute
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const c = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        const { data } = await c.auth.getUser();
        if (data?.user) userId = data.user.id;
      } catch (_) { /* guest */ }
    }

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { legend_id, contributor_name, contributor_email, amount, message } = parsed.data;

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: legend } = await service.from("national_legends").select("id, full_name, flower_min_amount").eq("id", legend_id).single();
    if (!legend) throw new Error("Legend not found");
    const minAmount = legend.flower_min_amount || 100;
    if (amount < minAmount) throw new Error(`Minimum tribute is KES ${minAmount}`);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const code = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const reference = `RDO-TRB-${dateStr}-${code}`;

    await service.from("legend_contributions").insert({
      legend_id,
      contributor_user_id: userId,
      contributor_name,
      contributor_email,
      contribution_type: "tribute",
      amount,
      message: message || null,
      status: "pending",
      payment_reference: reference,
    });

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: contributor_email,
        amount: amount * 100,
        currency: "KES",
        reference,
        metadata: { type: "legend_tribute", user_id: userId, legend_id, amount, contributor_name },
        callback_url: `${req.headers.get("origin") || "https://restdearone.com"}/national-legends`,
      }),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.message || "Paystack error");
    return new Response(JSON.stringify({ authorization_url: json.data.authorization_url, reference }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
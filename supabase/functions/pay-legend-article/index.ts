import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({ article_id: z.string().uuid() });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || Deno.env.get("SK_PAYSTACK");
    if (!PAYSTACK_SECRET_KEY) throw new Error("Payment secret key is not configured");

    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: article } = await service.from("legend_articles").select("*").eq("id", parsed.data.article_id).maybeSingle();
    if (!article) return new Response(JSON.stringify({ error: "Article not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (article.submitted_by !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (article.status !== "awaiting_payment") return new Response(JSON.stringify({ error: "Article is not awaiting payment" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!article.price_amount || article.price_amount < 1) return new Response(JSON.stringify({ error: "Price not set by admin yet" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const code = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const reference = `RDO-ART-${dateStr}-${code}`;

    await service.from("legend_articles").update({ payment_reference: reference }).eq("id", article.id);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: article.author_email,
        amount: article.price_amount * 100,
        currency: "KES",
        reference,
        metadata: { type: "legend_article", user_id: user.id, article_id: article.id, legend_id: article.legend_id },
        callback_url: `${req.headers.get("origin") || "https://restdearone.com"}/national-legends`,
      }),
    });
    const json = await res.json();
    if (!json.status) return new Response(JSON.stringify({ error: json.message || "Payment provider error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ authorization_url: json.data.authorization_url, reference }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
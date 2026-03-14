import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { type, memorial_id, community_id, billing_cycle } = await req.json();

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let amount: number;
    let currency = "KES";
    let metadata: Record<string, string> = { user_id: user.id };

    if (type === "memorial") {
      if (!memorial_id) throw new Error("memorial_id required");
      const { data: memorial } = await serviceClient.from("memorial_pages").select("id, created_by").eq("id", memorial_id).single();
      if (!memorial) throw new Error("Memorial not found");
      amount = 25000; // KES 250 in kobo/cents
      metadata.memorial_id = memorial_id;
      metadata.type = "memorial";

      await serviceClient.from("payments").insert({
        user_id: user.id,
        memorial_id,
        amount: 250,
        currency: "KES",
        status: "pending",
      });
    } else if (type === "community") {
      if (!community_id) throw new Error("community_id required");
      const cycle = billing_cycle || "monthly";
      amount = cycle === "yearly" ? 500000 : 50000; // KES 5000/yr or 500/mo
      metadata.community_id = community_id;
      metadata.type = "community";
      metadata.billing_cycle = cycle;

      await serviceClient.from("community_payments").insert({
        user_id: user.id,
        community_id,
        amount: cycle === "yearly" ? 5000 : 500,
        currency: "KES",
        billing_cycle: cycle,
        status: "pending",
      });
    } else {
      throw new Error("Invalid payment type");
    }

    // Get user email
    const { data: profile } = await serviceClient.from("profiles").select("email").eq("id", user.id).single();

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile?.email || user.email,
        amount,
        currency,
        metadata,
        callback_url: `${req.headers.get("origin") || "https://restdearone.com"}/dashboard`,
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackData.status) throw new Error(paystackData.message || "Paystack error");

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

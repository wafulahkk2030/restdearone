import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FLOWER_TIERS: Record<string, { name: string; price: number }> = {
  memory_daisy: { name: "Memory Daisy", price: 250 },
  grace_lily: { name: "Grace Lily", price: 500 },
  golden_rose: { name: "Golden Rose", price: 750 },
  eternal_orchid: { name: "Eternal Orchid", price: 1000 },
  heaven_blossom: { name: "Heaven Blossom", price: 3000 },
  legacy_bouquet: { name: "Legacy Bouquet", price: 5000 },
  celestial_garden: { name: "Celestial Garden", price: 10000 },
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

    const { memorial_id, flower_type, tribute_note } = await req.json();

    if (!memorial_id || !flower_type) throw new Error("memorial_id and flower_type required");

    const tier = FLOWER_TIERS[flower_type];
    if (!tier) throw new Error("Invalid flower type");

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify memorial exists
    const { data: memorial } = await serviceClient.from("memorial_pages").select("id, full_name").eq("id", memorial_id).single();
    if (!memorial) throw new Error("Memorial not found");

    // Get user profile
    const { data: profile } = await serviceClient.from("profiles").select("email, display_name, username").eq("id", user.id).single();
    const senderName = profile?.display_name || profile?.username || "Anonymous";

    // Create pending tribute
    await serviceClient.from("flower_tributes").insert({
      memorial_id,
      sender_user_id: user.id,
      sender_name: senderName,
      flower_type,
      tribute_value: tier.price,
      tribute_note: tribute_note || null,
      status: "pending",
    });

    // Initialize Paystack payment
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile?.email || user.email,
        amount: tier.price * 100, // Convert to kobo/cents
        currency: "KES",
        metadata: {
          type: "flower_tribute",
          user_id: user.id,
          memorial_id,
          flower_type,
          sender_name: senderName,
        },
        callback_url: `${req.headers.get("origin") || "https://restdearone.com"}/memorial/${memorial_id}`,
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

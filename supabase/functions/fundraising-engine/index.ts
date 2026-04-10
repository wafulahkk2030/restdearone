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

    const { action, fundraiser_id, amount, is_anonymous, note_to_family } = await req.json();

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "contribute") {
      if (!fundraiser_id || !amount || amount < 50) throw new Error("Invalid fundraiser_id or amount (min 50)");

      // Verify fundraiser exists and is active
      const { data: fundraiser } = await serviceClient.from("fundraisers").select("id, title, status, short_id, slug").eq("id", fundraiser_id).single();
      if (!fundraiser) throw new Error("Fundraiser not found");
      if (fundraiser.status !== "active") throw new Error("Fundraiser is no longer active");

      // NO fee deduction on contribution — fees are taken at payout
      // Full amount goes to the fundraiser total
      const grossAmount = amount;

      // Get user profile
      const { data: profile } = await serviceClient.from("profiles").select("email, display_name, username").eq("id", user.id).single();
      const donorName = is_anonymous ? "Anonymous" : (profile?.display_name || profile?.username || "Anonymous");

      // Generate reference
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      const reference = `RDO-FND-${dateStr}-${randomCode}`;

      // Create pending contribution — gross = net (no fee on contribution)
      await serviceClient.from("contributions").insert({
        fundraiser_id,
        user_id: user.id,
        donor_name: donorName,
        gross_amount: grossAmount,
        platform_fee: 0,
        net_amount: grossAmount,
        payment_reference: reference,
        payment_status: "pending",
        is_anonymous: !!is_anonymous,
        note_to_family: note_to_family || null,
      });

      // Initialize Paystack — charge exact amount (no fee markup)
      const callbackUrl = fundraiser.short_id
        ? `${req.headers.get("origin") || "https://restdearone.com"}/support/${fundraiser.slug}-${fundraiser.short_id}`
        : `${req.headers.get("origin") || "https://restdearone.com"}/fundraise/${fundraiser_id}`;

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: profile?.email || user.email,
          amount: grossAmount * 100, // Convert to kobo/cents
          currency: "KES",
          reference,
          metadata: {
            type: "fundraiser_contribution",
            fundraiser_id,
            user_id: user.id,
            donor_name: donorName,
            amount: grossAmount,
            is_anonymous: !!is_anonymous,
            note_to_family: note_to_family || null,
          },
          callback_url: callbackUrl,
        }),
      });

      const paystackData = await paystackRes.json();
      if (!paystackData.status) throw new Error(paystackData.message || "Paystack error");

      return new Response(JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Unknown action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

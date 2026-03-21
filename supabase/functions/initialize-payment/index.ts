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

    const { type, memorial_id, community_id, billing_cycle, amount: clientAmount } = await req.json();

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Generate custom reference: RDO-YYYYMMDD-XXXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueCode = crypto.randomUUID().slice(0, 6).toUpperCase();
    const customReference = `RDO-${dateStr}-${uniqueCode}`;

    let amount: number;
    let currency = "KES";
    let metadata: Record<string, string> = { user_id: user.id };

    if (type === "memorial") {
      // Memorial page activation - KES 100
      if (!memorial_id) throw new Error("memorial_id required");
      const { data: memorial } = await serviceClient.from("memorial_pages").select("id, created_by").eq("id", memorial_id).single();
      if (!memorial) throw new Error("Memorial not found");
      amount = 10000; // KES 100 in kobo/cents
      metadata.memorial_id = memorial_id;
      metadata.type = "memorial";

      await serviceClient.from("payments").insert({
        user_id: user.id,
        memorial_id,
        amount: 100,
        currency: "KES",
        status: "pending",
        payment_reference: customReference,
      });

    } else if (type === "memorial_creation") {
      // Payment for 3rd memorial creation (escalating)
      if (!memorial_id) throw new Error("memorial_id required");
      
      // Server-side verification: count user's memorials to determine correct price
      const { count } = await serviceClient.from("memorial_pages").select("id", { count: "exact", head: true }).eq("created_by", user.id);
      const totalCreated = (count || 1) - 1; // -1 because the current one was just created
      const groupNumber = Math.floor(totalCreated / 3);
      const positionInGroup = totalCreated % 3;
      
      if (positionInGroup !== 2) {
        throw new Error("Payment not required for this memorial");
      }
      
      const serverAmount = 250 + (groupNumber * 250);
      amount = serverAmount * 100; // Convert to kobo/cents
      metadata.memorial_id = memorial_id;
      metadata.type = "memorial_creation";

      await serviceClient.from("payments").insert({
        user_id: user.id,
        memorial_id,
        amount: serverAmount,
        currency: "KES",
        status: "pending",
        payment_reference: customReference,
      });

    } else if (type === "story_posting") {
      // Payment for 3rd story per user on a memorial
      if (!memorial_id) throw new Error("memorial_id required");
      
      // Server-side: count user's stories on this memorial
      const { count } = await serviceClient.from("stories").select("id", { count: "exact", head: true })
        .eq("author_id", user.id).eq("memorial_id", memorial_id);
      const storyCount = count || 0;
      const positionInGroup = storyCount % 3;
      const groupNumber = Math.floor(storyCount / 3);
      
      if (positionInGroup !== 2) {
        throw new Error("Payment not required for this story");
      }
      
      const serverAmount = 250 + (groupNumber * 250);
      amount = serverAmount * 100;
      metadata.memorial_id = memorial_id;
      metadata.type = "story_posting";
      metadata.story_count = String(storyCount);

      await serviceClient.from("payments").insert({
        user_id: user.id,
        memorial_id,
        amount: serverAmount,
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

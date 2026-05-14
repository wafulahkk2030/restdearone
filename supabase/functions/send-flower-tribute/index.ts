import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

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

const BodySchema = z.object({
  memorial_id: z.string().uuid(),
  flower_type: z.enum([
    "memory_daisy","grace_lily","golden_rose","eternal_orchid",
    "heaven_blossom","legacy_bouquet","celestial_garden",
  ]),
  tribute_note: z.string().trim().max(500).optional().nullable(),
  guest_email: z.string().email().optional().nullable(),
  guest_name: z.string().trim().min(1).max(100).optional().nullable(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY not configured");

    // Auth is OPTIONAL — guests may send tributes without signing in
    const authHeader = req.headers.get("authorization");
    let user: { id: string; email?: string } | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data } = await supabase.auth.getUser();
        if (data?.user) user = { id: data.user.id, email: data.user.email };
      } catch (_) { /* treat as guest */ }
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { memorial_id, flower_type, tribute_note, guest_email, guest_name } = parsed.data;

    // Guests must provide an email for the payment receipt
    if (!user && !guest_email) {
      return new Response(JSON.stringify({ error: "Email is required to send a tribute as a guest" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tier = FLOWER_TIERS[flower_type];
    if (!tier) throw new Error("Invalid flower type");

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify memorial exists
    const { data: memorial } = await serviceClient.from("memorial_pages").select("id, full_name").eq("id", memorial_id).single();
    if (!memorial) throw new Error("Memorial not found");

    // Resolve sender identity
    let senderEmail: string | null = guest_email || null;
    let senderName = guest_name?.trim() || "Anonymous";
    if (user) {
      const { data: profile } = await serviceClient.from("profiles").select("email, display_name, username").eq("id", user.id).single();
      senderEmail = profile?.email || user.email || senderEmail;
      senderName = profile?.display_name || profile?.username || senderName;
    }

    // Generate RDO reference for flower tributes
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const reference = `RDO-FLW-${dateStr}-${randomCode}`;

    // Create pending tribute
    await serviceClient.from("flower_tributes").insert({
      memorial_id,
      sender_user_id: user?.id ?? null,
      sender_name: senderName,
      sender_email: senderEmail,
      flower_type,
      tribute_value: tier.price,
      tribute_note: tribute_note || null,
      status: "pending",
      payment_reference: reference,
    });

    // Initialize Paystack payment
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: senderEmail,
        amount: tier.price * 100, // Convert to kobo/cents
        currency: "KES",
        reference,
        metadata: {
          type: "flower_tribute",
          user_id: user?.id ?? null,
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

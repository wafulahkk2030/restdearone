import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function verifyPaystackSignature(body: string, signature: string, secret: string): boolean {
  // Paystack uses HMAC SHA512
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(body);
  // Use Web Crypto API for HMAC
  // For edge runtime, we'll verify inline
  return true; // Will be replaced with actual crypto verification below
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY not configured");

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    // Verify Paystack signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(PAYSTACK_SECRET_KEY),
      { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (expectedSig !== signature) {
      console.error("Invalid Paystack signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200 });
    }

    const { data } = event;
    const metadata = data.metadata || {};
    const reference = data.reference;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (metadata.type === "memorial") {
      // Update payment record
      await supabase.from("payments").update({
        status: "completed",
        payment_reference: reference,
      }).eq("memorial_id", metadata.memorial_id).eq("user_id", metadata.user_id).eq("status", "pending");

      // Activate memorial page for 7 days
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      await supabase.from("memorial_pages").update({
        status: "active",
        activation_expiry: expiry.toISOString(),
      }).eq("id", metadata.memorial_id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: "Your memorial page has been activated for 7 days!",
        link: `/memorial/${metadata.memorial_id}`,
      });

    } else if (metadata.type === "community") {
      const cycle = metadata.billing_cycle || "monthly";
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (cycle === "yearly" ? 365 : 30));

      await supabase.from("community_payments").update({
        status: "completed",
        payment_reference: reference,
        expires_at: expiry.toISOString(),
      }).eq("community_id", metadata.community_id).eq("user_id", metadata.user_id).eq("status", "pending");

      // Activate community
      await supabase.from("community_groups").update({
        is_active: true,
      }).eq("id", metadata.community_id);

      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: `Your community has been activated! (${cycle})`,
        link: `/community/${metadata.community_id}`,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});

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
      // Memorial page activation payment
      await supabase.from("payments").update({
        status: "completed",
        payment_reference: reference,
      }).eq("memorial_id", metadata.memorial_id).eq("user_id", metadata.user_id).eq("status", "pending");

      // Activate memorial page for 7 days
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      await supabase.from("memorial_pages").update({
        status: "active",
        activation_expiry: expiry.toISOString(),
      }).eq("id", metadata.memorial_id);

      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: "Your memorial page has been activated for 1 year!",
        link: `/memorial/${metadata.memorial_id}`,
      });

    } else if (metadata.type === "memorial_creation") {
      // Payment for 3rd memorial creation
      await supabase.from("payments").update({
        status: "completed",
        payment_reference: reference,
      }).eq("memorial_id", metadata.memorial_id).eq("user_id", metadata.user_id).eq("status", "pending");

      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: "Your memorial page creation payment was successful! You can now activate the page.",
        link: `/memorial/${metadata.memorial_id}`,
      });

    } else if (metadata.type === "story_posting") {
      // Payment for 3rd story posting
      await supabase.from("payments").update({
        status: "completed",
        payment_reference: reference,
      }).eq("memorial_id", metadata.memorial_id).eq("user_id", metadata.user_id).eq("status", "pending");

      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: "Your story posting payment was successful! You can now post your story.",
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

      await supabase.from("community_groups").update({
        is_active: true,
      }).eq("id", metadata.community_id);

      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: `Your community has been activated! (${cycle})`,
        link: `/community/${metadata.community_id}`,
      });

    } else if (metadata.type === "flower_tribute") {
      // Mark tribute as completed
      await supabase.from("flower_tributes").update({
        status: "completed",
        payment_reference: reference,
      }).eq("memorial_id", metadata.memorial_id)
        .eq("sender_user_id", metadata.user_id)
        .eq("flower_type", metadata.flower_type)
        .eq("status", "pending");

      // Get memorial info for notification
      const { data: memorial } = await supabase.from("memorial_pages")
        .select("created_by, full_name").eq("id", metadata.memorial_id).single();

      if (memorial) {
        const flowerNames: Record<string, string> = {
          memory_daisy: "Memory Daisy", grace_lily: "Grace Lily", golden_rose: "Golden Rose",
          eternal_orchid: "Eternal Orchid", heaven_blossom: "Heaven Blossom",
          legacy_bouquet: "Legacy Bouquet", celestial_garden: "Celestial Garden",
        };
        const flowerName = flowerNames[metadata.flower_type] || metadata.flower_type;

        await supabase.from("notifications").insert({
          user_id: memorial.created_by,
          message: `${metadata.sender_name} shared a ${flowerName} with the memory of ${memorial.full_name}.`,
          link: `/memorial/${metadata.memorial_id}`,
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});

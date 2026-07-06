import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || Deno.env.get("SK_PAYSTACK");
    if (!PAYSTACK_SECRET_KEY) throw new Error("Payment secret key is not configured");

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
      await supabase.from("payments").update({ status: "completed", payment_type: "memorial" }).eq("payment_reference", reference).eq("status", "pending");
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
      await supabase.from("payments").update({ status: "completed", payment_type: "memorial_creation" }).eq("payment_reference", reference).eq("status", "pending");
      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: "Your memorial page creation payment was successful! You can now activate the page.",
        link: `/memorial/${metadata.memorial_id}`,
      });

    } else if (metadata.type === "story_posting") {
      await supabase.from("payments").update({ status: "completed", payment_type: "story_posting" }).eq("payment_reference", reference).eq("status", "pending");
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
        expires_at: expiry.toISOString(),
      }).eq("payment_reference", reference).eq("status", "pending");
      await supabase.from("community_groups").update({ is_active: true }).eq("id", metadata.community_id);
      await supabase.from("notifications").insert({
        user_id: metadata.user_id,
        message: `Your community has been activated! (${cycle})`,
        link: `/community/${metadata.community_id}`,
      });

    } else if (metadata.type === "flower_tribute") {
      const { data: completedFlowers } = await supabase.from("flower_tributes").update({
        status: "completed",
        payment_reference: reference,
      }).eq("payment_reference", reference)
        .eq("status", "pending")
        .select("id");

      if (!completedFlowers?.length) {
        return new Response("OK", { status: 200 });
      }

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

        // Revenue sharing: if tribute is KES 5000+, memorial creator gets 65%
        const flowerPrices: Record<string, number> = {
          memory_daisy: 250, grace_lily: 500, golden_rose: 750,
          eternal_orchid: 1000, heaven_blossom: 3000,
          legacy_bouquet: 5000, celestial_garden: 10000,
        };
        const tributeAmount = flowerPrices[metadata.flower_type] || 0;
        
        if (tributeAmount >= 5000) {
          const creatorShare = Math.round(tributeAmount * 0.65);
          
          // Notify memorial creator
          await supabase.from("notifications").insert({
            user_id: memorial.created_by,
            message: `🎉 Great news! A ${flowerName} tribute (KES ${tributeAmount.toLocaleString()}) qualifies for revenue sharing. You will receive KES ${creatorShare.toLocaleString()} (65%) at the end of the month. Contributions now at KES ${tributeAmount.toLocaleString()}.`,
            link: `/memorial/${metadata.memorial_id}`,
          });

          // Notify admins
          const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["super_admin", "platform_admin"]);
          for (const admin of (admins || [])) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              message: `💐 Revenue sharing triggered: Send KES ${creatorShare.toLocaleString()} to the creator of "${memorial.full_name}" memorial page at end of month. Tribute: ${flowerName} (KES ${tributeAmount.toLocaleString()}).`,
              link: `/memorial/${metadata.memorial_id}`,
            });
          }
        }
      }

    } else if (metadata.type === "fundraiser_contribution") {
      // Prevent duplicate processing
      const { data: contribution } = await supabase.from("contributions")
        .select("*")
        .eq("payment_reference", reference)
        .single();

      if (contribution && contribution.payment_status !== "success") {
        // Verify amount matches
        const paystackAmount = data.amount / 100;
        if (paystackAmount !== contribution.gross_amount) {
          console.error(`Amount mismatch: Paystack=${paystackAmount}, DB=${contribution.gross_amount}`);
          return new Response("Amount mismatch", { status: 400 });
        }

        // Update contribution status
        await supabase.from("contributions")
          .update({ payment_status: "success" })
          .eq("id", contribution.id);

        // Atomic update fundraiser total
        await supabase.rpc("increment_fundraiser_amount", {
          fundraiser_id_input: contribution.fundraiser_id,
          amount_input: contribution.net_amount,
        });

        // Notify admin
        const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["super_admin", "platform_admin"]);
        for (const admin of (admins || [])) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            message: `New fundraiser contribution: KES ${contribution.gross_amount.toLocaleString()} (Net: KES ${contribution.net_amount.toLocaleString()}, Fee: KES ${contribution.platform_fee.toLocaleString()})`,
            link: `/fundraise/${contribution.fundraiser_id}`,
          });
        }
      }
    } else if (metadata.type === "legend_article") {
      const { data: paidArticles } = await supabase.from("legend_articles").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_reference: reference,
      }).eq("id", metadata.article_id)
        .eq("status", "awaiting_payment")
        .select("id, submitted_by");

      if (paidArticles?.length) {
        if (metadata.user_id) {
          await supabase.from("notifications").insert({
            user_id: metadata.user_id,
            message: "Your article payment was successful. It will appear on the legend's page once an admin approves it.",
            link: `/national-legends`,
          });
        }

        const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["super_admin", "platform_admin"]);
        for (const admin of (admins || [])) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            message: "A paid National Legend article is awaiting your final approval.",
            link: `/admin`,
          });
        }
      }
    } else if (metadata.type === "legend_tribute") {
      const { data: completedTributes } = await supabase.from("legend_contributions")
        .update({ status: "completed" })
        .eq("payment_reference", reference)
        .eq("status", "pending")
        .select("id, amount, contributor_name");

      if (!completedTributes?.length) {
        return new Response("OK", { status: 200 });
      }

      const completedTribute = completedTributes[0];
      const { data: legend } = await supabase.from("national_legends").select("current_tribute_amount, full_name").eq("id", metadata.legend_id).single();
      if (legend) {
        const newTotal = (legend.current_tribute_amount || 0) + Number(completedTribute.amount || 0);
        await supabase.from("national_legends").update({ current_tribute_amount: newTotal }).eq("id", metadata.legend_id);
        const { data: admins } = await supabase.from("user_roles").select("user_id").in("role", ["super_admin", "platform_admin"]);
        for (const admin of (admins || [])) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            message: `New tribute for ${legend.full_name}: KES ${Number(completedTribute.amount).toLocaleString()} from ${completedTribute.contributor_name || "Anonymous"}.`,
            link: `/national-legends`,
          });
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});

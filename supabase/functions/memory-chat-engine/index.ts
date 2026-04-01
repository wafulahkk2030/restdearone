import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { action, memorial_id, community_id, target_user_id, message, chat_id, message_type } = await req.json();

    if (action === "create_memorial_chat") {
      // Create a chat for a memorial page — user must follow it
      const { data: follows } = await serviceClient.from("memorial_followers").select("id").eq("memorial_id", memorial_id).eq("user_id", user.id).maybeSingle();
      if (!follows) throw new Error("You must follow this memorial to create a chat");

      const { data: memorial } = await serviceClient.from("memorial_pages").select("full_name").eq("id", memorial_id).single();
      const chatName = `${memorial?.full_name || "Memorial"} Memory Circle`;

      // Check if chat exists
      const { data: existing } = await serviceClient.from("chats").select("id").eq("memorial_id", memorial_id).eq("chat_type", "group").maybeSingle();
      if (existing) {
        // Just join
        await serviceClient.from("chat_members").upsert({ chat_id: existing.id, user_id: user.id }, { onConflict: "chat_id,user_id" });
        return new Response(JSON.stringify({ chat_id: existing.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: chat } = await serviceClient.from("chats").insert({
        chat_type: "group",
        name: chatName,
        memorial_id,
        created_by: user.id,
      }).select("id").single();

      if (chat) {
        await serviceClient.from("chat_members").insert({ chat_id: chat.id, user_id: user.id, role: "creator" });

        // Auto-add all followers
        const { data: followers } = await serviceClient.from("memorial_followers").select("user_id").eq("memorial_id", memorial_id);
        const members = (followers || []).filter(f => f.user_id !== user.id).map(f => ({ chat_id: chat.id, user_id: f.user_id }));
        if (members.length) await serviceClient.from("chat_members").insert(members);
      }

      return new Response(JSON.stringify({ chat_id: chat?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "create_community_chat") {
      const { data: member } = await serviceClient.from("community_members").select("id").eq("community_id", community_id).eq("user_id", user.id).maybeSingle();
      if (!member) throw new Error("You must be a community member");

      const { data: community } = await serviceClient.from("community_groups").select("name").eq("id", community_id).single();
      const chatName = `${community?.name || "Community"} Chat`;

      const { data: existing } = await serviceClient.from("chats").select("id").eq("community_id", community_id).eq("chat_type", "group").maybeSingle();
      if (existing) {
        await serviceClient.from("chat_members").upsert({ chat_id: existing.id, user_id: user.id }, { onConflict: "chat_id,user_id" });
        return new Response(JSON.stringify({ chat_id: existing.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: chat } = await serviceClient.from("chats").insert({
        chat_type: "group",
        name: chatName,
        community_id,
        created_by: user.id,
      }).select("id").single();

      if (chat) {
        await serviceClient.from("chat_members").insert({ chat_id: chat.id, user_id: user.id, role: "creator" });
      }

      return new Response(JSON.stringify({ chat_id: chat?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Unknown action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

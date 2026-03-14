import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const prompts = [
  "What habit reminds you of them?",
  "What lesson do you still carry from them today?",
  "What would they say if they could see you now?",
  "What small moment do you wish you could relive?",
  "What smell or sound brings their memory back instantly?",
  "What was their favorite way to show love?",
  "What phrase did they say that you'll never forget?",
  "What did they teach you without even trying?",
  "If you could tell them one thing today, what would it be?",
  "What made their laughter special?",
  "What food reminds you of them?",
  "How did they handle difficult times?",
  "What would they think of the person you've become?",
  "What was their greatest strength?",
  "What tradition did they start or carry on?",
  "What did they always make time for?",
  "How did they make ordinary days feel special?",
  "What advice of theirs do you find yourself repeating?",
  "What song makes you think of them?",
  "What quality of theirs do you see in yourself?",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const todayPrompt = prompts[new Date().getDate() % prompts.length];

    // Check if today's prompt already exists
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("memory_prompts")
      .select("id")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ prompt: todayPrompt, already_posted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("memory_prompts").insert({ prompt_text: todayPrompt });

    return new Response(JSON.stringify({ prompt: todayPrompt, posted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

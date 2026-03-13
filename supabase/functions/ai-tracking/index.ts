import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the","a","an","is","was","were","are","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","shall","can",
    "need","dare","ought","used","to","of","in","for","on","with","at","by","from",
    "as","into","through","during","before","after","above","below","between","out",
    "off","over","under","again","further","then","once","here","there","when","where",
    "why","how","all","both","each","few","more","most","other","some","such","no",
    "nor","not","only","own","same","so","than","too","very","just","don","now","he",
    "she","it","they","them","their","his","her","its","my","your","our","we","you",
    "i","me","him","us","what","which","who","whom","this","that","these","those","am",
    "but","if","or","because","until","while","and","about","up","down","also","still",
    "always","never","ever","every","one","two","much","many","said","told","like",
    "get","got","make","made","know","knew","think","thought","see","saw","come","came",
    "go","went","take","took","give","gave","tell","say","people","person","time","day",
    "way","thing","man","woman","life","world","year",
  ]);
  const personalityWords = new Set([
    "kind","generous","brave","humble","patient","wise","loving","caring","strong",
    "gentle","faithful","honest","loyal","funny","cheerful","compassionate","determined",
    "creative","resilient","passionate","selfless","grateful","joyful","peaceful","warm",
    "teacher","mentor","leader","friend","hero","storyteller","football","cooking","music",
    "prayer","church","garden","singing","dancing","reading","writing","laughter","kindness",
    "wisdom","courage","faith","hope","love","generosity","patience","humility","integrity",
    "dignity","respect",
  ]);

  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
    if (personalityWords.has(word)) freq[word] += 2;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
}

// Harmful content + abusive language detection
function detectHarmfulContent(text: string): { flagged: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const lower = text.toLowerCase();
  const patterns = [
    { pattern: /\b(hate|kill|murder|threat|die|death\s*to)\b/i, reason: "potential_harmful_language" },
    { pattern: /\b(spam|buy now|click here|free money)\b/i, reason: "potential_spam" },
    { pattern: /\b(idiot|stupid|fool|dumb|moron|trash|worthless|pathetic|loser)\b/i, reason: "abusive_language" },
    { pattern: /\b(fuck|shit|damn|bitch|ass|bastard|crap|hell)\b/i, reason: "profanity" },
    { pattern: /\b(nigger|faggot|retard)\b/i, reason: "hate_speech" },
  ];
  for (const { pattern, reason } of patterns) {
    if (pattern.test(lower)) reasons.push(reason);
  }
  return { flagged: reasons.length > 0, reasons };
}

// Calculate engagement score for community members
function calculateEngagementScore(data: { stories_posted: number; days_since_join: number; last_active_days: number }): number {
  const postScore = Math.min(data.stories_posted * 10, 50);
  const recencyScore = data.last_active_days <= 1 ? 30 : data.last_active_days <= 7 ? 20 : data.last_active_days <= 30 ? 10 : 0;
  const tenureScore = Math.min(data.days_since_join * 0.5, 20);
  return Math.round((postScore + recencyScore + tenureScore) * 100) / 100;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, data } = await req.json();

    if (action === "extract_keywords") {
      const { memorial_id, text } = data;
      const keywords = extractKeywords(text);
      for (const keyword of keywords) {
        const { data: existing } = await supabase
          .from("memory_keywords").select("id, frequency")
          .eq("memorial_id", memorial_id).eq("keyword", keyword).maybeSingle();
        if (existing) {
          await supabase.from("memory_keywords").update({ frequency: existing.frequency + 1 }).eq("id", existing.id);
        } else {
          await supabase.from("memory_keywords").insert({ memorial_id, keyword, frequency: 1 });
        }
      }
      return new Response(JSON.stringify({ success: true, keywords }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "moderate_content") {
      const { content, content_type, content_id } = data;
      const result = detectHarmfulContent(content);
      if (result.flagged) {
        // Silent flag - only super admin can see
        await supabase.from("content_flags").insert({
          content_type, content_id,
          flag_reason: result.reasons.join(", "),
          details: { original_content: content.substring(0, 500), detected_at: new Date().toISOString() },
        });
        // Also create a report for admin review
        await supabase.from("reports").insert({
          content_type, content_id,
          reported_by: "00000000-0000-0000-0000-000000000000",
          reason: `AI flagged: ${result.reasons.join(", ")}`,
          status: "pending",
        });
      }
      return new Response(JSON.stringify({ flagged: result.flagged, reasons: result.reasons }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "track_activity") {
      const { user_id, event_type, metadata } = data;
      await supabase.from("admin_activity_logs").insert({
        admin_id: user_id || "00000000-0000-0000-0000-000000000000",
        action: `user_${event_type}`,
        target_type: "analytics",
        details: metadata,
      });

      // Update community member engagement score if community-related
      if (metadata?.community_id && user_id) {
        const { data: member } = await supabase.from("community_members")
          .select("id, stories_posted, joined_at, last_active_at")
          .eq("community_id", metadata.community_id).eq("user_id", user_id).maybeSingle();
        
        if (member) {
          const daysSinceJoin = Math.floor((Date.now() - new Date(member.joined_at).getTime()) / 86400000);
          const lastActiveDays = member.last_active_at ? Math.floor((Date.now() - new Date(member.last_active_at).getTime()) / 86400000) : daysSinceJoin;
          const storiesPosted = event_type === "community_story_posted" ? (member.stories_posted || 0) + 1 : member.stories_posted || 0;
          
          const score = calculateEngagementScore({ stories_posted: storiesPosted, days_since_join: daysSinceJoin, last_active_days: 0 });
          
          await supabase.from("community_members").update({
            ai_engagement_score: score,
            last_active_at: new Date().toISOString(),
            stories_posted: storiesPosted,
          }).eq("id", member.id);
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate_prompt") {
      const { memorial_id } = data;
      const { data: memorial } = await supabase
        .from("memorial_pages").select("full_name, personality_summary, common_phrase")
        .eq("id", memorial_id).single();
      if (!memorial) {
        return new Response(JSON.stringify({ error: "Memorial not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: prompts } = await supabase.from("memory_prompts").select("prompt_text").limit(1).order("id", { ascending: false });
      const promptText = prompts?.[0]?.prompt_text || "What is a memory you cherish about them?";
      const personalized = promptText.replace(/them|they/gi, memorial.full_name);
      return new Response(JSON.stringify({ prompt: personalized, memorial_name: memorial.full_name }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

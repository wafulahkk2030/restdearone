import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, Quote, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LivingMemoryFeed = () => {
  const [memorials, setMemorials] = useState<any[]>([]);

  // Curated fallback memorials — used to top up to 3 cards when DB has fewer entries
  const fallbackMemorials = [
    { id: "fallback-1", full_name: "Brian Kisiangani", birth_year: 1989, death_year: 2023, relationship_to_creator: "friend", personality_summary: "Brian used to wake up earlier than everyone just to make tea for the house. He said mornings should start with kindness.", life_lesson: "Begin every day with a small act of love.", common_phrase: "Start gentle, the day will follow." },
    { id: "fallback-2", full_name: "Amina Wanjiku", birth_year: 1974, death_year: 2018, relationship_to_creator: "mother", personality_summary: "Dear Mum, I still hear your voice every time I make tea in the morning. You taught me that love is in the small things.", life_lesson: "Love lives in the smallest, quietest moments.", common_phrase: "Pole pole, mtoto wangu." },
    { id: "fallback-3", full_name: "James Ochieng", birth_year: 1955, death_year: 2021, relationship_to_creator: "father", personality_summary: "Papa always said a man is measured not by what he has, but by what he gives. He lived that truth every single day.", life_lesson: "Generosity is the truest measure of a life.", common_phrase: "A man is measured by what he gives." },
  ];

  useEffect(() => {
    const load = async () => {
      const { data: latest } = await supabase
        .from("memorial_pages")
        .select("*, memorial_followers(count), stories(count)")
        .order("created_at", { ascending: false })
        .limit(30);

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newest = latest?.[0]?.created_at ? new Date(latest[0].created_at).getTime() : 0;

      const scoreOf = (m: any) => (m.memorial_followers?.[0]?.count || 0) * 2 + (m.stories?.[0]?.count || 0);
      let chosen: any[] = [...(latest || [])].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 3);

      // If newest is older than 7 days, rotate from a larger pool (deterministic per-day)
      if (latest && latest.length > 0 && newest < sevenDaysAgo) {
        const { data: pool } = await supabase
          .from("memorial_pages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (pool && pool.length > 0) {
          const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
          const shuffled = [...pool].sort((a, b) => {
            const ha = (a.id + seed).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
            const hb = (b.id + seed).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
            return ha - hb;
          });
          chosen = shuffled.slice(0, 3);
        }
      }

      // Always guarantee 3 cards — top up with curated fallbacks if needed
      if (chosen.length < 3) {
        const needed = 3 - chosen.length;
        chosen = [...chosen, ...fallbackMemorials.slice(0, needed)];
      }

      setMemorials(chosen);
    };
    load();
  }, []);

  const displayData = memorials.length > 0 ? memorials : fallbackMemorials;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Stories Being Remembered Today</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">A living feed of memories, letters, and reflections shared by people who loved deeply.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayData.slice(0, 3).map((m, i) => (
            <Link key={m.id} to={String(m.id).startsWith("fallback-") ? "/create-memorial" : `/memorial/${m.id}`}>
              <motion.div
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors break-words">{m.full_name}</h3>
                <p className="text-xs text-muted-foreground font-body mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {m.birth_year} – {m.death_year}
                  {m.relationship_to_creator && <span className="ml-2 capitalize">· {m.relationship_to_creator}</span>}
                </p>
                {m.personality_summary && (
                  <p className="text-sm text-foreground/80 font-body leading-relaxed italic line-clamp-3 mb-3">
                    <Quote className="inline w-3 h-3 mr-1 text-primary/60" />{m.personality_summary}
                  </p>
                )}
                {m.life_lesson && (
                  <p className="text-sm text-foreground/70 font-body leading-relaxed line-clamp-2 mb-3">
                    <span className="font-semibold text-foreground">Lesson: </span>{m.life_lesson}
                  </p>
                )}
                {m.common_phrase && (
                  <p className="text-xs text-muted-foreground font-body italic line-clamp-2 mb-3">
                    They used to say: "{m.common_phrase}"
                  </p>
                )}
                <div className="mt-auto pt-4 flex items-center gap-4 border-t border-border/50">
                  <span className="text-xs text-primary font-body font-medium flex items-center gap-1"><BookOpen className="w-3 h-3" /> Read Full Story</span>
                  <span className="text-xs text-sage font-body font-medium flex items-center gap-1"><Users className="w-3 h-3" /> Follow</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LivingMemoryFeed;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fallbackLetters = [
  { id: "1", title: "Dear Mum", content: "I still hear your voice every time I make tea in the morning. You taught me that love is in the small things…", profiles: { display_name: "Amina K." }, memorial_id: null },
  { id: "2", title: "Dear Brian", content: "I scored a goal last weekend and the first person I wanted to tell was you. I know you would have celebrated the loudest…", profiles: { display_name: "Kevin M." }, memorial_id: null },
];

const LettersSection = () => {
  const [letters, setLetters] = useState<any[]>(fallbackLetters);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, title, content, memorial_id, author_id")
        .eq("story_type", "letter")
        .order("created_at", { ascending: false })
        .limit(4);
      if (data && data.length > 0) {
        // Fetch display names separately
        const authorIds = [...new Set(data.map(d => d.author_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", authorIds);
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
        setLetters(data.map(d => ({ ...d, profiles: profileMap[d.author_id] || {} })));
      }
    };
    load();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Letters to the Departed</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Words people are still writing to those they love. Because some conversations never end.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {letters.map((letter, i) => (
            <motion.div
              key={letter.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-display text-sm font-semibold text-foreground">{letter.title}</span>
              </div>
              <p className="text-sm text-foreground/80 font-body leading-relaxed italic mb-4 line-clamp-3">
                "{letter.content}"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">— {letter.profiles?.display_name || "Anonymous"}</span>
                {letter.memorial_id && (
                  <Link to={`/memorial/${letter.memorial_id}`} className="text-xs text-primary font-body font-medium hover:underline">
                    Read Letter
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LettersSection;

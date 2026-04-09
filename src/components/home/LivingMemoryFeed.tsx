import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, BookOpen, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LivingMemoryFeed = () => {
  const [memorials, setMemorials] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("memorial_pages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (data && data.length > 0) setMemorials(data);
    };
    load();
  }, []);

  // Show placeholder if no real data
  const displayData = memorials.length > 0 ? memorials : [
    { id: "1", full_name: "Brian Kisiangani", birth_year: 1989, death_year: 2023, personality_summary: "Brian used to wake up earlier than everyone just to make tea for the house. He said mornings should start with kindness.", relationship_to_creator: "friend" },
    { id: "2", full_name: "Amina Wanjiku", birth_year: 1974, death_year: 2018, personality_summary: "Dear Mum, I still hear your voice every time I make tea in the morning. You taught me that love is in the small things…", relationship_to_creator: "mother" },
    { id: "3", full_name: "James Ochieng", birth_year: 1955, death_year: 2021, personality_summary: "Papa always said, 'A man is measured not by what he has, but by what he gives.' He lived that truth every single day.", relationship_to_creator: "father" },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Stories Being Remembered Today</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">A living feed of memories, letters, and reflections shared by people who loved deeply.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {displayData.slice(0, 3).map((m, i) => (
            <Link key={m.id} to={memorials.length > 0 ? `/memorial/${m.id}` : "/create-memorial"}>
              <motion.div
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{m.full_name}</h3>
                <p className="text-xs text-muted-foreground font-body mb-4">{m.birth_year} – {m.death_year}</p>
                <p className="text-sm text-foreground/80 font-body leading-relaxed italic line-clamp-3">
                  "{m.personality_summary || 'A life worth remembering.'}"
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <span className="text-xs text-primary font-body font-medium flex items-center gap-1"><BookOpen className="w-3 h-3" /> Read Story</span>
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

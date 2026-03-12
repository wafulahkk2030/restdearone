import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const fallbackKeywords = [
  { keyword: "kindness", frequency: 5 },
  { keyword: "football", frequency: 3 },
  { keyword: "teacher", frequency: 4 },
  { keyword: "mentor", frequency: 2 },
  { keyword: "generous", frequency: 6 },
  { keyword: "faith", frequency: 3 },
  { keyword: "laughter", frequency: 5 },
  { keyword: "cooking", frequency: 2 },
  { keyword: "wisdom", frequency: 4 },
  { keyword: "courage", frequency: 3 },
  { keyword: "patience", frequency: 2 },
  { keyword: "music", frequency: 4 },
  { keyword: "prayer", frequency: 3 },
  { keyword: "storyteller", frequency: 5 },
  { keyword: "humble", frequency: 2 },
];

const MemoryEchoWall = () => {
  const [keywords, setKeywords] = useState(fallbackKeywords);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("memory_keywords")
        .select("keyword, frequency")
        .order("frequency", { ascending: false })
        .limit(30);
      if (data && data.length > 0) setKeywords(data);
    };
    load();
  }, []);

  return (
    <section className="py-20 bg-card overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Memory Echo Wall</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Words that define the people we remember. The personality of loved ones, emerging from stories.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 max-w-3xl mx-auto">
          {keywords.map((kw, i) => (
            <motion.span
              key={kw.keyword}
              className="font-display text-primary cursor-pointer hover:text-sage transition-colors duration-300"
              style={{
                fontSize: `${Math.min(2.2, 0.9 + kw.frequency * 0.2)}rem`,
                opacity: Math.min(1, 0.5 + kw.frequency * 0.08),
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ scale: 1.1 }}
            >
              {kw.keyword}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MemoryEchoWall;

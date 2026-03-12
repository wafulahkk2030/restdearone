import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const StatsSection = () => {
  const [stats, setStats] = useState([
    { label: "Stories Shared", value: 0 },
    { label: "Lives Remembered", value: 0 },
    { label: "Letters Written", value: 0 },
    { label: "Community Members", value: 0 },
  ]);

  useEffect(() => {
    const load = async () => {
      const [stories, memorials, letters, profiles] = await Promise.all([
        supabase.from("stories").select("id", { count: "exact" }),
        supabase.from("memorial_pages").select("id", { count: "exact" }),
        supabase.from("stories").select("id", { count: "exact" }).eq("story_type", "letter"),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);
      setStats([
        { label: "Stories Shared", value: stories.count || 0 },
        { label: "Lives Remembered", value: memorials.count || 0 },
        { label: "Letters Written", value: letters.count || 0 },
        { label: "Community Members", value: profiles.count || 0 },
      ]);
    };
    load();
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fallbackPrompts = [
  "What made them laugh the most?",
  "What was their favorite saying?",
  "What habit defined them?",
  "What lesson did they teach you?",
  "What food did they love?",
  "What was their dream?",
];

const MemoryPromptsSection = () => {
  const [prompts, setPrompts] = useState<string[]>(fallbackPrompts);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("memory_prompts").select("prompt_text").limit(6);
      if (data && data.length > 0) setPrompts(data.map(p => p.prompt_text));
    };
    load();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Share a Memory</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Sometimes all you need is a little prompt to unlock a beautiful memory.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {prompts.map((prompt, i) => (
            <Link key={prompt} to="/create-memorial">
              <motion.div
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="font-display text-base text-foreground italic mb-3">"{prompt}"</p>
                <span className="text-xs text-primary font-body font-medium flex items-center gap-1 group-hover:underline">
                  <PenLine className="w-3 h-3" /> Write a Story
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MemoryPromptsSection;

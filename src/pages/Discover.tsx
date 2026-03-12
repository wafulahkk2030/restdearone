import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Discover = () => {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const discoverRandom = async () => {
    setLoading(true);
    // Get count then fetch random
    const { count } = await supabase.from("memorial_pages").select("id", { count: "exact" });
    if (!count || count === 0) {
      setPage(null);
      setLoading(false);
      return;
    }
    const offset = Math.floor(Math.random() * count);
    const { data } = await supabase
      .from("memorial_pages")
      .select("*")
      .range(offset, offset)
      .limit(1)
      .single();
    setPage(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Discover a Life</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto mb-8">
              Every person who ever lived had a story worth knowing. Let us introduce you to someone beautiful.
            </p>
            <Button variant="warm" size="lg" className="gap-2" onClick={discoverRandom} disabled={loading}>
              <Shuffle className="w-4 h-4" />
              {loading ? "Finding..." : page ? "Discover Another Life" : "Remember Someone Randomly"}
            </Button>
          </motion.div>

          {page && (
            <motion.div
              key={page.id}
              className="mt-12 bg-card border border-border rounded-2xl p-8 text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">{page.full_name}</h2>
                <p className="text-muted-foreground font-body text-sm">{page.birth_year} – {page.death_year}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-body bg-accent text-accent-foreground capitalize">
                  Remembered by their {page.relationship_to_creator}
                </span>
              </div>

              <div className="space-y-5">
                {page.personality_summary && (
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground mb-1">Personality</h3>
                    <p className="text-sm text-foreground/80 font-body leading-relaxed">{page.personality_summary}</p>
                  </div>
                )}
                {page.common_phrase && (
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground mb-1">They Used to Say</h3>
                    <p className="text-sm text-foreground/80 font-body italic">"{page.common_phrase}"</p>
                  </div>
                )}
                {page.life_lesson && (
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground mb-1">The Last Lesson</h3>
                    <p className="text-sm text-foreground/80 font-body leading-relaxed">{page.life_lesson}</p>
                  </div>
                )}
              </div>

              <div className="text-center mt-6">
                <Link to={`/memorial/${page.id}`}>
                  <Button variant="hero" size="sm">Visit Memory Page</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {!page && !loading && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground font-body text-sm">Click the button above to discover a life worth remembering.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Discover;

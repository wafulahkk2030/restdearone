import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Search, Heart, BookOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const Explore = () => {
  const [memorials, setMemorials] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemorials();
  }, []);

  const loadMemorials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("memorial_pages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setMemorials(data || []);
    setLoading(false);
  };

  const filtered = memorials.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.personality_summary || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.life_lesson || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Explore Stories</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto mb-6">
              Read the memories, letters, and lessons people have shared about those they love.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search names, stories, or lessons..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </motion.div>

          {loading ? (
            <p className="text-center text-muted-foreground font-body">Loading stories...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-body mb-4">
                {search ? "No memorials match your search." : "No memorial pages yet. Be the first to create one."}
              </p>
              <Link to="/create-memorial" className="text-primary font-body font-medium hover:underline">Create a Memory Page</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((m, i) => (
                <Link key={m.id} to={`/memorial/${m.id}`}>
                  <motion.div
                    className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-body font-medium px-2 py-1 rounded-md ${
                        m.status === 'active' ? 'bg-sage/20 text-sage' : 'bg-accent text-accent-foreground'
                      }`}>
                        {m.status === 'active' ? '🟢 Active' : m.status}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {m.full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body mb-3">{m.birth_year} – {m.death_year}</p>
                    {m.personality_summary && (
                      <p className="text-sm text-foreground/80 font-body leading-relaxed italic line-clamp-2">
                        "{m.personality_summary}"
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-xs text-primary font-body font-medium flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Read Stories
                      </span>
                      <span className="text-xs text-sage font-body font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" /> Follow
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Explore;

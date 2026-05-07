import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shuffle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 9;

const Discover = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const { data } = await supabase
      .from("memorial_pages")
      .select("id, full_name, birth_year, death_year, relationship_to_creator, personality_summary, status")
      .eq("status", "active" as any)
      .order("created_at", { ascending: false })
      .limit(60);
    setPages(data || []);
    setLoading(false);
  };

  const discoverRandom = async () => {
    setDiscovering(true);
    const { count } = await supabase.from("memorial_pages").select("id", { count: "exact" }).eq("status", "active" as any);
    if (!count || count === 0) { setFeatured(null); setDiscovering(false); return; }
    const offset = Math.floor(Math.random() * count);
    const { data } = await supabase
      .from("memorial_pages")
      .select("*")
      .eq("status", "active" as any)
      .range(offset, offset)
      .limit(1)
      .single();
    setFeatured(data);
    setDiscovering(false);
  };

  const filteredPages = search
    ? pages.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()))
    : pages;

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredPages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Discover a Life</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto mb-6">
              Every person who ever lived had a story worth knowing. Let us introduce you to someone beautiful.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button variant="warm" size="lg" className="gap-2" onClick={discoverRandom} disabled={discovering}>
                <Shuffle className="w-4 h-4" />
                {discovering ? "Finding..." : "Surprise Me"}
              </Button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </motion.div>

          {/* Random featured */}
          {featured && (
            <motion.div
              key={featured.id}
              className="mb-10 bg-card border border-border rounded-2xl p-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-display text-2xl font-bold text-foreground">{featured.full_name}</h2>
              <p className="text-muted-foreground font-body text-sm">{featured.birth_year} – {featured.death_year}</p>
              {featured.personality_summary && (
                <p className="text-sm text-foreground/80 font-body mt-3 max-w-lg mx-auto leading-relaxed">{featured.personality_summary}</p>
              )}
              <Link to={`/memorial/${featured.id}`}>
                <Button variant="hero" size="sm" className="mt-4">Visit Memory Page</Button>
              </Link>
            </motion.div>
          )}

          {/* Grid of pages */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-body animate-pulse">Loading memories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((page, i) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/memorial/${page.id}`} className="block bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all hover:shadow-md group">
                    <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{page.full_name}</h3>
                    <p className="text-xs text-muted-foreground font-body mt-1">{page.birth_year} – {page.death_year}</p>
                    {page.personality_summary && (
                      <p className="text-sm text-foreground/70 font-body mt-2 line-clamp-2">{page.personality_summary}</p>
                    )}
                    <span className="text-xs text-primary font-body mt-3 inline-block">Visit page →</span>
                  </Link>
                </motion.div>
              ))}
              {filteredPages.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground font-body py-8">
                  {search ? "No matches found." : "No active memorial pages yet."}
                </p>
              )}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground font-body px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Discover;

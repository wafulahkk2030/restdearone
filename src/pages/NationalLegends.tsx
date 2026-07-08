import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Flag, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const NationalLegends = () => {
  const { user } = useAuth();
  const [legends, setLegends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("national_legends")
        .select("*")
        .eq("status", "approved")
        .eq("visibility", "public")
        .order("death_year", { ascending: false });
      const legendsData = data || [];
      // Rank by total paid tribute contributions (more honoured = more visible).
      // Amounts are only shown to admin; the ranking itself is public.
      if (legendsData.length > 0) {
        const ids = legendsData.map((l: any) => l.id);
        const { data: contribs } = await supabase
          .from("legend_contributions")
          .select("legend_id, amount")
          .in("legend_id", ids)
          .eq("status", "completed")
          .eq("contribution_type", "tribute");
        const totals = new Map<string, number>();
        (contribs || []).forEach((c: any) => {
          totals.set(c.legend_id, (totals.get(c.legend_id) || 0) + (c.amount || 0));
        });
        legendsData.sort((a: any, b: any) => (totals.get(b.id) || 0) - (totals.get(a.id) || 0));
      }
      setLegends(legendsData);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>National Legends — RestDearOne</title>
        <meta name="description" content="Honoring those who died for a great cause and sparked a national mourning. A permanent memorial of Kenya's heroes." />
        <link rel="canonical" href="https://restdearone.lovable.app/national-legends" />
      </Helmet>
      <Navbar />
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-body tracking-widest uppercase mb-6">
            <Flag className="w-3.5 h-3.5" /> A Nation Remembers
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight">
            This is a <span className="text-primary italic">National Legend.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base md:text-lg text-muted-foreground font-body mt-5 max-w-2xl mx-auto leading-relaxed">
            For those who died for a great cause and sparked a national mourning. Their lives belong to all of us now.
          </motion.p>
          {user && (
            <Link to="/national-legends/submit">
              <Button variant="hero" className="mt-8 gap-2">Submit a Legend for Review</Button>
            </Link>
          )}
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <p className="text-center text-muted-foreground font-body">Loading…</p>
          ) : legends.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <p className="text-muted-foreground font-body">No legends have been published yet. Admin-approved tributes will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {legends.map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/national-legends/${l.slug || l.id}`} className="block group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all h-full">
                    <div className="aspect-video bg-muted overflow-hidden relative">
                      {l.banner_image_url ? (
                        <img src={l.banner_image_url} alt={l.full_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-sage/20 flex items-center justify-center">
                          <Flag className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      {l.is_official && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 text-xs font-body text-primary">
                          <ShieldCheck className="w-3 h-3" /> Official
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">{l.full_name}</h3>
                      {l.title && <p className="text-xs text-primary font-body mt-1">{l.title}</p>}
                      <p className="text-xs text-muted-foreground font-body mt-1">{l.birth_year ? `${l.birth_year} – ` : ""}{l.death_year}</p>
                      <p className="text-sm text-muted-foreground font-body mt-3 line-clamp-3 leading-relaxed">{l.national_impact_summary}</p>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary font-body">
                        Read tribute <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default NationalLegends;
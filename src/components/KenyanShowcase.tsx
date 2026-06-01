import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import kenyaFamily from "@/assets/kenya-family.jpg";
import kenyaLandscape from "@/assets/kenya-landscape.jpg";
import kenyaCommunity from "@/assets/kenya-community.jpg";

const fallback = [
  { src: kenyaFamily, title: "Family.", caption: "Stories passed from generation to generation, from Nairobi to Nyanza.", href: "/explore" },
  { src: kenyaLandscape, title: "Land.", caption: "From Mount Kenya to the Rift Valley — every life leaves a footprint on home soil.", href: "/explore" },
  { src: kenyaCommunity, title: "Community.", caption: "Together we mourn, together we remember, together we keep the flame alive.", href: "/explore" },
];

type Item = { src: string; title: string; caption: string; href: string };

const KenyanShowcase = () => {
  const [items, setItems] = useState<Item[]>(fallback);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("memorial_photos" as any)
        .select("photo_url, caption, memorial_id, created_at, memorial_pages!inner(full_name)")
        .order("created_at", { ascending: false })
        .limit(3);
      const rows = (data as any[]) || [];
      if (rows.length === 0) return;
      const mapped: Item[] = rows.map((r) => ({
        src: r.photo_url,
        title: r.memorial_pages?.full_name || "In loving memory",
        caption: r.caption || "A cherished memory shared by the community.",
        href: `/memorial/${r.memorial_id}`,
      }));
      // fill up to 3 with fallbacks if needed
      while (mapped.length < 3) mapped.push(fallback[mapped.length]);
      setItems(mapped.slice(0, 3));
    })();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-primary font-body text-xs tracking-[0.3em] uppercase">Made for Kenya, told by Kenyans</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3">Stories that look like home.</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <Link to={it.href} className="block absolute inset-0">
                <img src={it.src} alt={it.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-2xl font-bold text-foreground">{it.title}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed line-clamp-2">{it.caption}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KenyanShowcase;
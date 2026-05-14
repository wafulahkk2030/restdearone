import { motion } from "framer-motion";
import kenyaFamily from "@/assets/kenya-family.jpg";
import kenyaLandscape from "@/assets/kenya-landscape.jpg";
import kenyaCommunity from "@/assets/kenya-community.jpg";

const items = [
  { src: kenyaFamily, title: "Family.", caption: "Stories passed from generation to generation, from Nairobi to Nyanza." },
  { src: kenyaLandscape, title: "Land.", caption: "From Mount Kenya to the Rift Valley — every life leaves a footprint on home soil." },
  { src: kenyaCommunity, title: "Community.", caption: "Together we mourn, together we remember, together we keep the flame alive." },
];

const KenyanShowcase = () => {
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
              <img src={it.src} alt={it.title} loading="lazy" width={1536} height={1024} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl font-bold text-foreground">{it.title}</h3>
                <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">{it.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KenyanShowcase;
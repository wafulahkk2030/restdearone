import { motion } from "framer-motion";

const WhySection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Why This Platform Exists
          </h2>
          <p className="text-muted-foreground font-body leading-relaxed text-lg">
            Most people disappear from the internet after they pass away.
            But every life leaves stories worth remembering.
          </p>
          <p className="text-foreground font-body leading-relaxed text-lg mt-4 font-medium">
            RestDearOne exists so families and communities can keep those stories alive.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhySection;

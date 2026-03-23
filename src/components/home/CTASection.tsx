import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-sage/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Preserve Their Story
          </h2>
          <p className="text-muted-foreground font-body mb-4 leading-relaxed">
            Create a page to remember someone you loved.
            Invite others to share memories and reflections.
          </p>
          <p className="text-sm text-muted-foreground/70 font-body mb-8">
            KES 100 activates a Living Memory Page for 1 year with daily prompts.
          </p>
          <Link to="/create-memorial">
            <Button variant="hero">Create a Memory Page</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-sage/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-light/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
            Every Life Leaves{" "}
            <span className="text-primary italic">a Story.</span>
          </h1>
        </motion.div>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          A place to remember loved ones through stories, lessons, and memories
          that continue to inspire. Because people don't disappear when they die —
          their stories live on through those who loved them.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link to="/create-memorial">
            <Button variant="hero">Create a Memory Page</Button>
          </Link>
          <Link to="/explore">
            <Button variant="heroOutline">Explore Stories</Button>
          </Link>
        </motion.div>

        <motion.p
          className="mt-8 text-sm text-muted-foreground/70 font-body italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          "Facebook deactivates, we reactivate."
        </motion.p>
      </div>
    </section>
  );
};

export default HeroSection;

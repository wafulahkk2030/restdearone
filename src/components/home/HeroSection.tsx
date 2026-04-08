import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--sage) / 0.06) 0%, transparent 70%)" }}
          animate={{ y: [0, 25, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 right-[25%] w-48 h-48 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--gold) / 0.1) 0%, transparent 70%)" }}
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        {/* Decorative dotted arcs */}
        <svg className="absolute top-1/4 right-[5%] w-64 h-64 opacity-10" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="hsl(var(--sage))" strokeWidth="0.5" strokeDasharray="3 8" />
        </svg>
      </div>

      <motion.div className="container mx-auto px-4 relative z-10 text-center max-w-3xl" style={{ y, opacity }}>
        {/* Tagline */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-primary font-body text-sm tracking-[0.3em] uppercase">Where memories live forever</span>
          <div className="h-px w-8 bg-primary/40" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        >
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-foreground leading-[1.1] mb-6">
            Every Life Leaves{" "}
            <span className="relative inline-block">
              <span className="text-primary italic">a Story.</span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary/30 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                style={{ transformOrigin: "left" }}
              />
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          A place to remember loved ones through stories, lessons, and memories
          that continue to inspire. Because people don't disappear when they die —
          their stories live on through those who loved them.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Link to="/create-memorial">
            <Button variant="hero" size="lg" className="text-base px-8">Create a Memory Page</Button>
          </Link>
          <Link to="/explore">
            <Button variant="heroOutline" size="lg" className="text-base px-8">Explore Stories</Button>
          </Link>
        </motion.div>

        <motion.p
          className="mt-10 text-sm text-muted-foreground/60 font-body italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          "Facebook deactivates, we reactivate."
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          className="mt-16 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1 h-2 bg-muted-foreground/40 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

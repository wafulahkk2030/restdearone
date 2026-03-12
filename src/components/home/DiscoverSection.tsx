import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DiscoverSection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Discover a Life
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto mb-8">
            Every person who ever lived had a story worth knowing.
            Discover a stranger whose life still feels meaningful.
          </p>
          <Link to="/discover">
            <Button variant="warm" size="lg" className="gap-2">
              <Shuffle className="w-4 h-4" />
              Remember Someone Randomly
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DiscoverSection;

import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const letters = [
  {
    to: "Mum",
    preview: "I still hear your voice every time I make tea in the morning. You taught me that love is in the small things…",
    author: "Sarah W.",
  },
  {
    to: "Brian",
    preview: "I scored a goal last weekend and the first person I wanted to tell was you. I know you would have celebrated the loudest…",
    author: "Kevin M.",
  },
];

const LettersSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Letters to the Departed
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Words people are still writing to those they love. Because some conversations never end.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {letters.map((letter, i) => (
            <motion.div
              key={letter.to}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-display text-sm font-semibold text-foreground">Dear {letter.to},</span>
              </div>
              <p className="text-sm text-foreground/80 font-body leading-relaxed italic mb-4">
                "{letter.preview}"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">— {letter.author}</span>
                <button className="text-xs text-primary font-body font-medium hover:underline">Read Letter</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LettersSection;

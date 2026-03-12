import { motion } from "framer-motion";

const keywords = [
  { word: "kindness", size: "text-2xl", opacity: "opacity-90" },
  { word: "football", size: "text-lg", opacity: "opacity-70" },
  { word: "teacher", size: "text-xl", opacity: "opacity-80" },
  { word: "mentor", size: "text-base", opacity: "opacity-60" },
  { word: "generous", size: "text-3xl", opacity: "opacity-100" },
  { word: "faith", size: "text-lg", opacity: "opacity-75" },
  { word: "laughter", size: "text-2xl", opacity: "opacity-85" },
  { word: "cooking", size: "text-base", opacity: "opacity-65" },
  { word: "wisdom", size: "text-xl", opacity: "opacity-80" },
  { word: "courage", size: "text-lg", opacity: "opacity-70" },
  { word: "patience", size: "text-base", opacity: "opacity-60" },
  { word: "music", size: "text-xl", opacity: "opacity-75" },
  { word: "prayer", size: "text-lg", opacity: "opacity-70" },
  { word: "storyteller", size: "text-2xl", opacity: "opacity-85" },
  { word: "humble", size: "text-base", opacity: "opacity-65" },
];

const MemoryEchoWall = () => {
  return (
    <section className="py-20 bg-card overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Memory Echo Wall
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Words that define the people we remember. Click any word to read related stories.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 max-w-3xl mx-auto">
          {keywords.map((kw, i) => (
            <motion.span
              key={kw.word}
              className={`${kw.size} ${kw.opacity} font-display text-primary cursor-pointer hover:text-sage transition-colors duration-300`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ scale: 1.1 }}
            >
              {kw.word}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MemoryEchoWall;

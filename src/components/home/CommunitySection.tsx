import { motion } from "framer-motion";

const categories = [
  { name: "Losing a Parent", count: 342 },
  { name: "Losing a Friend", count: 218 },
  { name: "Community Heroes", count: 156 },
  { name: "Life Lessons", count: 489 },
  { name: "Remembering Teachers", count: 127 },
  { name: "Celebrating Life", count: 264 },
];

const CommunitySection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Stories from the Community
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Join conversations about grief, growth, and the lasting impact of the people who shaped us.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              className="bg-background border border-border rounded-xl p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <p className="font-display text-sm font-semibold text-foreground mb-1">{cat.name}</p>
              <p className="text-xs text-muted-foreground font-body">{cat.count} stories</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;

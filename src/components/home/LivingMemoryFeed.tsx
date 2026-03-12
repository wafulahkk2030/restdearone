import { motion } from "framer-motion";
import { Heart, BookOpen, Users } from "lucide-react";

const storyPreviews = [
  {
    name: "Brian Kisiangani",
    years: "1989 – 2023",
    preview: "Brian used to wake up earlier than everyone just to make tea for the house. He said mornings should start with kindness.",
    type: "Memory",
    reactions: 24,
  },
  {
    name: "Mary Njeri",
    years: "1974 – 2018",
    preview: "Dear Mum, I still hear your voice every time I make tea in the morning. You taught me that love is in the small things…",
    type: "Letter",
    reactions: 41,
  },
  {
    name: "James Ochieng",
    years: "1955 – 2021",
    preview: "Papa always said, 'A man is measured not by what he has, but by what he gives.' He lived that truth every single day.",
    type: "Lesson",
    reactions: 38,
  },
];

const LivingMemoryFeed = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Stories Being Remembered Today
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            A living feed of memories, letters, and reflections shared by people who loved deeply.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {storyPreviews.map((story, i) => (
            <motion.div
              key={story.name}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-1 rounded-md">
                  {story.type}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="w-3 h-3" />
                  <span>{story.reactions}</span>
                </div>
              </div>

              <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {story.name}
              </h3>
              <p className="text-xs text-muted-foreground font-body mb-4">{story.years}</p>

              <p className="text-sm text-foreground/80 font-body leading-relaxed italic">
                "{story.preview}"
              </p>

              <div className="mt-5 flex items-center gap-4">
                <button className="text-xs text-primary font-body font-medium hover:underline flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Read Story
                </button>
                <button className="text-xs text-sage font-body font-medium hover:underline flex items-center gap-1">
                  <Users className="w-3 h-3" /> Follow
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LivingMemoryFeed;

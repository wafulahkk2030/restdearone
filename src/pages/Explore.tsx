import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Heart, BookOpen, Users } from "lucide-react";

const sampleStories = [
  {
    name: "Brian Kisiangani",
    years: "1989 – 2023",
    preview: "Brian used to wake up earlier than everyone just to make tea for the house.",
    type: "Memory",
    reactions: 24,
  },
  {
    name: "Mary Njeri",
    years: "1974 – 2018",
    preview: "My mother's hands were never idle. She knitted love into everything she touched.",
    type: "Reflection",
    reactions: 41,
  },
  {
    name: "James Ochieng",
    years: "1955 – 2021",
    preview: "Papa always said, 'A man is measured not by what he has, but by what he gives.'",
    type: "Lesson",
    reactions: 38,
  },
  {
    name: "Grace Wanjiku",
    years: "1960 – 2020",
    preview: "She had this way of making everyone feel like the most important person in the room.",
    type: "Memory",
    reactions: 32,
  },
  {
    name: "David Mutua",
    years: "1982 – 2022",
    preview: "Dear David, I still save you a seat at the table every Sunday...",
    type: "Letter",
    reactions: 56,
  },
  {
    name: "Agnes Chebet",
    years: "1945 – 2019",
    preview: "Grandmother taught me that patience is a garden — you water it daily, and one day it blooms.",
    type: "Lesson",
    reactions: 29,
  },
];

const Explore = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Explore Stories
            </h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto mb-6">
              Read the memories, letters, and lessons people have shared about those they love.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search stories, names, or lessons..." className="pl-10" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleStories.map((story, i) => (
              <motion.div
                key={story.name + i}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
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
                <p className="text-xs text-muted-foreground font-body mb-3">{story.years}</p>
                <p className="text-sm text-foreground/80 font-body leading-relaxed italic">"{story.preview}"</p>
                <div className="mt-4 flex items-center gap-4">
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
      </div>
      <Footer />
    </div>
  );
};

export default Explore;

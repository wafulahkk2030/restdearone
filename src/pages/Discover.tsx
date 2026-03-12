import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const samplePages = [
  {
    name: "Brian Kisiangani",
    years: "1989 – 2023",
    relationship: "Friend",
    personality: "He was the loudest in the room but always the kindest. Brian believed every morning should start with tea and a good conversation.",
    phrase: "Mornings should start with kindness.",
    lesson: "Generosity does not require wealth.",
    stories: 14,
    followers: 28,
  },
  {
    name: "Mary Njeri",
    years: "1974 – 2018",
    relationship: "Mother",
    personality: "Quiet strength. She never raised her voice, but when she spoke, everyone listened.",
    phrase: "Love is in the small things.",
    lesson: "Patience is a garden — you water it daily, and one day it blooms.",
    stories: 22,
    followers: 45,
  },
  {
    name: "James Ochieng",
    years: "1955 – 2021",
    relationship: "Father",
    personality: "A storyteller, a builder, a man who measured his wealth in the lives he touched.",
    phrase: "A man is measured not by what he has, but by what he gives.",
    lesson: "Show up. Even when it's hard, show up for the people you love.",
    stories: 31,
    followers: 67,
  },
];

const Discover = () => {
  const [current, setCurrent] = useState<number | null>(null);

  const discoverRandom = () => {
    let next = Math.floor(Math.random() * samplePages.length);
    if (next === current) next = (next + 1) % samplePages.length;
    setCurrent(next);
  };

  const page = current !== null ? samplePages[current] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Discover a Life</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto mb-8">
              Every person who ever lived had a story worth knowing. Let us introduce you to someone beautiful.
            </p>
            <Button variant="warm" size="lg" className="gap-2" onClick={discoverRandom}>
              <Shuffle className="w-4 h-4" />
              {current === null ? "Remember Someone Randomly" : "Discover Another Life"}
            </Button>
          </motion.div>

          {page && (
            <motion.div
              key={current}
              className="mt-12 bg-card border border-border rounded-2xl p-8 text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">{page.name}</h2>
                <p className="text-muted-foreground font-body text-sm">{page.years}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-body bg-accent text-accent-foreground">
                  Remembered by their {page.relationship}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1">Personality</h3>
                  <p className="text-sm text-foreground/80 font-body leading-relaxed">{page.personality}</p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1">They Used to Say</h3>
                  <p className="text-sm text-foreground/80 font-body italic">"{page.phrase}"</p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1">The Last Lesson</h3>
                  <p className="text-sm text-foreground/80 font-body leading-relaxed">{page.lesson}</p>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground font-body">{page.stories} memories shared</span>
                  <span className="text-xs text-muted-foreground font-body">{page.followers} followers</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Discover;

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const categories = [
  { name: "Losing a Parent", slug: "losing-a-parent" },
  { name: "Losing a Friend", slug: "losing-a-friend" },
  { name: "Community Heroes", slug: "community-heroes" },
  { name: "Life Lessons", slug: "life-lessons" },
  { name: "Remembering Teachers", slug: "remembering-teachers" },
  { name: "Celebrating Life", slug: "celebrating-life" },
];

const forumPosts = [
  {
    title: "What my grandmother taught me about kindness",
    author: "Sarah W.",
    category: "Life Lessons",
    comments: 12,
    preview: "She never had much, but she always had enough to share. I remember her splitting her last piece of bread with a stranger...",
  },
  {
    title: "The last conversation I had with my father",
    author: "Kevin M.",
    category: "Losing a Parent",
    comments: 23,
    preview: "We talked about football, of all things. He told me his team would win the league that year. They did. He didn't see it...",
  },
  {
    title: "My teacher who believed in me when no one else did",
    author: "Agnes C.",
    category: "Remembering Teachers",
    comments: 8,
    preview: "Mrs. Odhiambo kept me after class one day. I thought I was in trouble. Instead, she told me I was the smartest student she'd ever taught...",
  },
  {
    title: "Things I learned from losing someone suddenly",
    author: "James K.",
    category: "Life Lessons",
    comments: 31,
    preview: "Nothing prepares you for it. One day they're there, the next they're not. But what I learned changed everything about how I love...",
  },
];

const Forum = () => {
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
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">The Memory Forum</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              Share broader reflections, life lessons, and stories about loss, love, and the people who shaped us.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map(cat => (
              <button
                key={cat.slug}
                className="px-4 py-2 rounded-lg text-xs font-body border border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent transition-all"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {forumPosts.map((post, i) => (
              <motion.div
                key={post.title}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer group"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-1 rounded-md">{post.category}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.comments} comments</span>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-foreground/80 font-body leading-relaxed">{post.preview}</p>
                <p className="text-xs text-muted-foreground font-body mt-3">— {post.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Forum;

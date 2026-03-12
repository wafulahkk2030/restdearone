import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { MessageCircle, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = {
  losing_a_parent: "Losing a Parent",
  losing_a_friend: "Losing a Friend",
  community_heroes: "Community Heroes",
  life_lessons: "Life Lessons",
  remembering_teachers: "Remembering Teachers",
  celebrating_life: "Celebrating Life",
};

const categories = Object.entries(categoryLabels);

const Forum = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "life_lessons" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("forum_posts")
      .select("*, profiles:author_id(display_name, username)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (activeCategory) query = query.eq("category", activeCategory as any);
    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  };

  const submitPost = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!form.title || !form.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("forum_posts").insert({
      author_id: user.id,
      title: form.title,
      content: form.content,
      category: form.category as any,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Story shared!" });
      setForm({ title: "", content: "", category: "life_lessons" });
      setShowForm(false);
      loadPosts();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">The Memory Forum</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              Share broader reflections, life lessons, and stories about loss, love, and the people who shaped us.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-lg text-xs font-body border transition-all ${
                !activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              All
            </button>
            {categories.map(([slug, name]) => (
              <button
                key={slug}
                onClick={() => setActiveCategory(slug)}
                className={`px-4 py-2 rounded-lg text-xs font-body border transition-all ${
                  activeCategory === slug ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-8">
            <Button variant="hero" onClick={() => setShowForm(!showForm)} className="gap-1">
              <PenLine className="w-4 h-4" />
              Write a Story
            </Button>
          </div>

          {showForm && (
            <motion.div className="bg-card border border-border rounded-xl p-6 mb-8 max-w-2xl mx-auto" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Share Your Story</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map(([slug, name]) => (
                    <button
                      key={slug}
                      onClick={() => setForm(f => ({ ...f, category: slug }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${
                        form.category === slug ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <Input placeholder="Story title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder="Share your reflection..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="min-h-[150px]" />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button variant="hero" onClick={submitPost} disabled={submitting}>{submitting ? "Sharing..." : "Share"}</Button>
                </div>
              </div>
            </motion.div>
          )}

          {loading ? (
            <p className="text-center text-muted-foreground font-body">Loading stories...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground font-body">No stories yet. Be the first to share.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-1 rounded-md">
                      {categoryLabels[post.category] || post.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{post.title}</h3>
                  <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <p className="text-xs text-muted-foreground font-body mt-3">
                    — {post.profiles?.display_name || post.profiles?.username || "Anonymous"} · {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Forum;

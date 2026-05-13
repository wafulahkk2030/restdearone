import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { MessageCircle, PenLine, Edit, Trash2, ChevronDown } from "lucide-react";
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
const PAGE_SIZE = 20;

const Forum = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "life_lessons" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    loadPosts(0, true);
  }, [activeCategory]);

  const loadPosts = async (pageNum: number, reset = false) => {
    setLoading(true);
    let query = supabase
      .from("forum_posts")
      .select("*, profiles:author_id(display_name, username)")
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    if (activeCategory) query = query.eq("category", activeCategory as any);
    const { data } = await query;
    const newPosts = data || [];
    if (reset) {
      setPosts(newPosts);
    } else {
      setPosts(prev => [...prev, ...newPosts]);
    }
    setHasMore(newPosts.length === PAGE_SIZE);
    setLoading(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
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
      setPosts([]);
      setPage(0);
      loadPosts(0, true);
    }
  };

  const startEditPost = (post: any) => {
    setEditingPost(post.id);
    setEditForm({ title: post.title, content: post.content });
  };

  const submitEditPost = async (postId: string) => {
    if (!editForm.title || !editForm.content) return;
    setSubmitting(true);
    const { error } = await supabase.from("forum_posts")
      .update({ title: editForm.title, content: editForm.content })
      .eq("id", postId);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post updated!" });
      setEditingPost(null);
      setPosts([]);
      setPage(0);
      loadPosts(0, true);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    // Delete comments first, then the post
    await supabase.from("forum_comments").delete().eq("post_id", postId);
    const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted" });
      setPosts(prev => prev.filter(p => p.id !== postId));
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

          {posts.length === 0 && !loading ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground font-body">No stories yet. Be the first to share.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => {
                const isAuthor = user?.id === post.author_id;
                const canEditOrDelete = isAuthor || isAdmin;
                const isEditingThis = editingPost === post.id;

                return (
                  <motion.div
                    key={post.id}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.03 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-1 rounded-md">
                        {categoryLabels[post.category] || post.category}
                      </span>
                      {canEditOrDelete && !isEditingThis && (
                        <div className="flex items-center gap-2">
                          {isAuthor && (
                            <button onClick={() => startEditPost(post)} className="text-xs text-muted-foreground hover:text-primary font-body flex items-center gap-1">
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                          )}
                          <button onClick={() => deletePost(post.id)} className="text-xs text-muted-foreground hover:text-destructive font-body flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-3">
                        <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                        <Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} className="min-h-[100px]" />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingPost(null)}>Cancel</Button>
                          <Button variant="hero" size="sm" onClick={() => submitEditPost(post.id)} disabled={submitting}>
                            {submitting ? "Saving..." : "Save Edit"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-2">{post.title}</h3>
                        <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        <p className="text-xs text-muted-foreground font-body mt-3">
                          — {post.profiles?.display_name || post.profiles?.username || "Anonymous"} · {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {hasMore && posts.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={loadMore} disabled={loading} className="gap-1">
                <ChevronDown className="w-4 h-4" />
                {loading ? "Loading..." : "Load More Stories"}
              </Button>
            </div>
          )}

          {loading && posts.length === 0 && (
            <p className="text-center text-muted-foreground font-body">Loading stories...</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Forum;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Heart, BookOpen, Users, PenLine, Mail, Lightbulb, MessageCircle } from "lucide-react";

const storyTypeLabels: Record<string, { label: string; icon: any }> = {
  memory: { label: "Memory", icon: BookOpen },
  letter: { label: "Letter", icon: Mail },
  lesson: { label: "Lesson", icon: Lightbulb },
  reflection: { label: "Reflection", icon: MessageCircle },
};

const MemorialPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [memorial, setMemorial] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyForm, setStoryForm] = useState({ title: "", content: "", story_type: "memory" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    const [memRes, storiesRes, kwRes, followRes] = await Promise.all([
      supabase.from("memorial_pages").select("*").eq("id", id).single(),
      supabase.from("stories").select("*, profiles:author_id(display_name, username)").eq("memorial_id", id).order("created_at", { ascending: false }),
      supabase.from("memory_keywords").select("*").eq("memorial_id", id).order("frequency", { ascending: false }).limit(20),
      supabase.from("memorial_followers").select("id", { count: "exact" }).eq("memorial_id", id),
    ]);
    setMemorial(memRes.data);
    setStories(storiesRes.data || []);
    setKeywords(kwRes.data || []);
    setFollowers(followRes.count || 0);

    if (user) {
      const { data } = await supabase.from("memorial_followers").select("id").eq("memorial_id", id).eq("user_id", user.id).maybeSingle();
      setIsFollowing(!!data);
    }
    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!user) { toast({ title: "Please sign in to follow", variant: "destructive" }); return; }
    if (isFollowing) {
      await supabase.from("memorial_followers").delete().eq("memorial_id", id).eq("user_id", user.id);
      setIsFollowing(false);
      setFollowers(f => f - 1);
    } else {
      await supabase.from("memorial_followers").insert({ memorial_id: id, user_id: user.id });
      setIsFollowing(true);
      setFollowers(f => f + 1);
    }
  };

  const submitStory = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!storyForm.title || !storyForm.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("stories").insert({
      memorial_id: id,
      author_id: user.id,
      title: storyForm.title,
      content: storyForm.content,
      story_type: storyForm.story_type as any,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Story shared!" });
      setStoryForm({ title: "", content: "", story_type: "memory" });
      setShowStoryForm(false);
      loadAll();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading memory page...</p>
      </div>
    </div>
  );

  if (!memorial) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 flex items-center justify-center">
        <p className="text-muted-foreground font-body">Memorial page not found.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-body bg-accent text-accent-foreground mb-4">
              {memorial.status === 'active' ? '🟢 Active Memory Page' : memorial.status === 'community' ? '🔵 Community Page' : '⚪ Inactive Page'}
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-1">{memorial.full_name}</h1>
            <p className="text-muted-foreground font-body">{memorial.birth_year} – {memorial.death_year}</p>
            <p className="text-sm text-muted-foreground font-body mt-1 capitalize">Remembered by their {memorial.relationship_to_creator}</p>

            <div className="flex items-center justify-center gap-6 mt-4">
              <span className="text-xs text-muted-foreground font-body">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
              <span className="text-xs text-muted-foreground font-body">{followers} followers</span>
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant={isFollowing ? "outline" : "warm"} size="sm" onClick={toggleFollow} className="gap-1">
                <Users className="w-4 h-4" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="hero" size="sm" onClick={() => setShowStoryForm(!showStoryForm)} className="gap-1">
                <PenLine className="w-4 h-4" />
                Write a Story
              </Button>
            </div>
          </motion.div>

          {/* About section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {memorial.personality_summary && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-2">Personality</h3>
                <p className="text-sm text-foreground/80 font-body leading-relaxed">{memorial.personality_summary}</p>
              </div>
            )}
            {memorial.common_phrase && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-2">They Used to Say</h3>
                <p className="text-sm text-foreground/80 font-body italic">"{memorial.common_phrase}"</p>
              </div>
            )}
            {memorial.life_lesson && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-2">The Last Lesson</h3>
                <p className="text-sm text-foreground/80 font-body leading-relaxed">{memorial.life_lesson}</p>
              </div>
            )}
            {memorial.unforgettable_moment && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-2">Unforgettable Moment</h3>
                <p className="text-sm text-foreground/80 font-body leading-relaxed">{memorial.unforgettable_moment}</p>
              </div>
            )}
          </div>

          {/* Memory Echo Cloud */}
          {keywords.length > 0 && (
            <div className="mb-10 text-center">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Memory Echo</h3>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {keywords.map(kw => (
                  <span
                    key={kw.keyword}
                    className="font-display text-primary cursor-pointer hover:text-sage transition-colors"
                    style={{ fontSize: `${Math.min(1.5, 0.8 + kw.frequency * 0.15)}rem`, opacity: Math.min(1, 0.5 + kw.frequency * 0.1) }}
                  >
                    {kw.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Story form */}
          {showStoryForm && (
            <motion.div className="bg-card border border-border rounded-xl p-6 mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Share a Story about {memorial.full_name}</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["memory", "letter", "lesson", "reflection"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setStoryForm(f => ({ ...f, story_type: type }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${
                        storyForm.story_type === type ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {storyTypeLabels[type].label}
                    </button>
                  ))}
                </div>
                <Input placeholder="Story title..." value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))} />
                <Textarea
                  placeholder={storyForm.story_type === 'letter' ? `Dear ${memorial.full_name},\n\n...` : "Share your memory..."}
                  value={storyForm.content}
                  onChange={e => setStoryForm(f => ({ ...f, content: e.target.value }))}
                  className="min-h-[150px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowStoryForm(false)}>Cancel</Button>
                  <Button variant="hero" onClick={submitStory} disabled={submitting}>
                    {submitting ? "Sharing..." : "Share Story"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stories */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-semibold text-foreground">Stories & Memories</h3>
            {stories.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground font-body">No stories yet. Be the first to share a memory.</p>
              </div>
            ) : (
              stories.map((story, i) => {
                const typeInfo = storyTypeLabels[story.story_type] || storyTypeLabels.memory;
                const Icon = typeInfo.icon;
                return (
                  <motion.div
                    key={story.id}
                    className="bg-card border border-border rounded-xl p-6"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-md">{typeInfo.label}</span>
                    </div>
                    <h4 className="font-display text-base font-semibold text-foreground mb-2">{story.title}</h4>
                    <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">{story.content}</p>
                    <p className="text-xs text-muted-foreground font-body mt-3">
                      — {story.profiles?.display_name || story.profiles?.username || "Anonymous"} · {new Date(story.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MemorialPage;

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
import { Heart, BookOpen, Users, PenLine, Mail, Lightbulb, MessageCircle, Edit, Flag, CreditCard, Lock, Flower2 } from "lucide-react";
import { getFlag } from "@/lib/countries";
import FlowerTributeDialog from "@/components/memorial/FlowerTributeDialog";
import TributeGarden from "@/components/memorial/TributeGarden";

const storyTypeLabels: Record<string, { label: string; icon: any }> = {
  memory: { label: "Memory", icon: BookOpen },
  letter: { label: "Letter", icon: Mail },
  lesson: { label: "Lesson", icon: Lightbulb },
  reflection: { label: "Reflection", icon: MessageCircle },
};

const reactionTypes = [
  { type: "touched_me", label: "This touched me", emoji: "💛" },
  { type: "relate_to_this", label: "I relate", emoji: "🤝" },
  { type: "thank_you_for_sharing", label: "Thank you", emoji: "🙏" },
];

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
  const [editingStory, setEditingStory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [reactions, setReactions] = useState<Record<string, any[]>>({});
  const [activating, setActivating] = useState(false);
  const [showFlowerDialog, setShowFlowerDialog] = useState(false);
  const [storyPaymentInfo, setStoryPaymentInfo] = useState<{ required: boolean; amount: number; freeRemaining: number } | null>(null);

  const isActive = memorial?.status === 'active';
  const isOwner = user?.id === memorial?.created_by;

  // Poll for status update after returning from payment
  useEffect(() => {
    if (!id || !memorial || memorial.status !== 'inactive') return;
    const url = new URL(window.location.href);
    const fromPayment = url.searchParams.get('trxref') || url.searchParams.get('reference');
    if (!fromPayment) return;

    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase.from("memorial_pages").select("status, activation_expiry").eq("id", id).single();
      if (data?.status === 'active') {
        setMemorial((prev: any) => ({ ...prev, status: 'active', activation_expiry: data.activation_expiry }));
        clearInterval(interval);
        toast({ title: "🎉 Page Activated!", description: "Your memorial page is now active for 1 year." });
        // Clean URL
        url.searchParams.delete('trxref');
        url.searchParams.delete('reference');
        window.history.replaceState({}, '', url.pathname);
      }
      if (attempts >= maxAttempts) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [id, memorial?.status]);

  const activateMemorial = async () => {
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }
    setActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: { type: "memorial", memorial_id: id },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
    }
    setActivating(false);
  };

  // Check story posting limits for current user
  const checkStoryLimits = async () => {
    if (!user || !id) return;
    const { count } = await supabase.from("stories").select("id", { count: "exact", head: true })
      .eq("author_id", user.id).eq("memorial_id", id);
    const storyCount = count || 0;
    const positionInGroup = storyCount % 3;
    const groupNumber = Math.floor(storyCount / 3);

    if (positionInGroup === 2) {
      const amount = 250 + (groupNumber * 250);
      setStoryPaymentInfo({ required: true, amount, freeRemaining: 0 });
    } else {
      const freeRemaining = 2 - positionInGroup;
      const nextAmount = 250 + (groupNumber * 250);
      setStoryPaymentInfo({ required: false, amount: nextAmount, freeRemaining });
    }
  };

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  useEffect(() => {
    if (user && id) checkStoryLimits();
  }, [user, id, stories.length]);

  const loadAll = async () => {
    setLoading(true);
    const [memRes, storiesRes, kwRes, followRes] = await Promise.all([
      supabase.from("memorial_pages").select("*").eq("id", id).single(),
      supabase.from("stories").select("*, profiles:author_id(display_name, username, country)").eq("memorial_id", id).order("created_at", { ascending: false }),
      supabase.from("memory_keywords").select("*").eq("memorial_id", id).order("frequency", { ascending: false }).limit(20),
      supabase.from("memorial_followers").select("id", { count: "exact" }).eq("memorial_id", id),
    ]);
    setMemorial(memRes.data);
    setStories(storiesRes.data || []);
    setKeywords(kwRes.data || []);
    setFollowers(followRes.count || 0);

    if (storiesRes.data?.length) {
      const storyIds = storiesRes.data.map((s: any) => s.id);
      const { data: rxns } = await supabase.from("story_reactions").select("*").in("story_id", storyIds);
      const grouped: Record<string, any[]> = {};
      (rxns || []).forEach((r: any) => {
        if (!grouped[r.story_id]) grouped[r.story_id] = [];
        grouped[r.story_id].push(r);
      });
      setReactions(grouped);
    }

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

  const handleWriteStory = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!isActive) { toast({ title: "This memorial page must be activated first", variant: "destructive" }); return; }

    // Re-check story limits
    await checkStoryLimits();

    if (storyPaymentInfo?.required) {
      // Redirect to payment
      try {
        const { data, error } = await supabase.functions.invoke("initialize-payment", {
          body: { type: "story_posting", memorial_id: id },
        });
        if (error) throw error;
        if (data?.authorization_url) {
          window.location.href = data.authorization_url;
          return;
        }
      } catch (err: any) {
        toast({ title: "Payment error", description: err.message, variant: "destructive" });
        return;
      }
    }

    setShowStoryForm(!showStoryForm);
  };

  const submitStory = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!isActive) { toast({ title: "This memorial page must be activated before posting stories", variant: "destructive" }); return; }
    if (!storyForm.title || !storyForm.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }

    // Server-side will also validate, but double-check client-side
    if (storyPaymentInfo?.required) {
      toast({ title: "Payment required", description: `You need to pay KES ${storyPaymentInfo.amount} to post this story.`, variant: "destructive" });
      return;
    }

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
      supabase.functions.invoke("ai-tracking", {
        body: { action: "extract_keywords", data: { memorial_id: id, text: `${storyForm.title} ${storyForm.content}` } },
      });
      setStoryForm({ title: "", content: "", story_type: "memory" });
      setShowStoryForm(false);
      loadAll();
    }
  };

  const startEdit = (story: any) => {
    setEditingStory(story.id);
    setEditForm({ title: story.title, content: story.content });
  };

  const submitEdit = async (storyId: string, currentEditCount: number) => {
    if (currentEditCount >= 2) {
      toast({ title: "Edit limit reached", description: "You can only edit a story twice.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("stories")
      .update({ title: editForm.title, content: editForm.content, edit_count: currentEditCount + 1 })
      .eq("id", storyId);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Story updated", description: `${2 - currentEditCount - 1} edit(s) remaining.` });
      setEditingStory(null);
      loadAll();
    }
  };

  const toggleReaction = async (storyId: string, reactionType: string) => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    const existing = (reactions[storyId] || []).find(r => r.user_id === user.id && r.reaction_type === reactionType);
    if (existing) {
      await supabase.from("story_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("story_reactions").insert({ story_id: storyId, user_id: user.id, reaction_type: reactionType as any });
    }
    loadAll();
  };

  const reportContent = async (contentType: string, contentId: string, reason: string) => {
    if (!user) return;
    await supabase.from("reports").insert({
      content_type: contentType,
      content_id: contentId,
      reported_by: user.id,
      reason,
    });
    toast({ title: "Reported", description: "Thank you. Our team will review this." });
  };

  // Format relationship display - handle "other" properly
  const getRelationshipDisplay = () => {
    const rel = memorial?.relationship_to_creator;
    if (!rel) return "";
    // Common relationships get "their X" treatment
    const standardRels = ["father", "mother", "brother", "sister", "friend", "colleague", "teacher", "partner", "mentor", "spouse"];
    if (standardRels.includes(rel)) {
      return `Remembered by their ${rel}`;
    }
    // Custom relationship (from "Other" option) - display as-is
    return `Remembered by ${rel}`;
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
            {(() => {
              const url = new URL(window.location.href);
              const fromPayment = url.searchParams.get('trxref') || url.searchParams.get('reference');
              const isPending = memorial.status === 'inactive' && fromPayment;
              return (
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-body mb-4 ${
                  memorial.status === 'active' ? 'bg-sage/20 text-sage' :
                  isPending ? 'bg-warm/20 text-warm animate-pulse' :
                  memorial.status === 'community' ? 'bg-primary/20 text-primary' :
                  'bg-accent text-accent-foreground'
                }`}>
                  {memorial.status === 'active' ? '🟢 Active Memory Page' :
                   isPending ? '⏳ Activating... Payment being confirmed' :
                   memorial.status === 'community' ? '🔵 Community Page' :
                   '⚪ Page Not Yet Activated'}
                </div>
              );
            })()}
            <h1 className="font-display text-4xl font-bold text-foreground mb-1">{memorial.full_name}</h1>
            <p className="text-muted-foreground font-body">{memorial.birth_year} – {memorial.death_year}</p>
            <p className="text-sm text-muted-foreground font-body mt-1 capitalize">{getRelationshipDisplay()}</p>

            <div className="flex items-center justify-center gap-6 mt-4">
              <span className="text-xs text-muted-foreground font-body">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
              <span className="text-xs text-muted-foreground font-body">{followers} followers</span>
            </div>

            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <Button variant={isFollowing ? "outline" : "warm"} size="sm" onClick={toggleFollow} className="gap-1">
                <Users className="w-4 h-4" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              {isActive ? (
                <>
                  <Button variant="hero" size="sm" onClick={handleWriteStory} className="gap-1">
                    <PenLine className="w-4 h-4" />
                    {storyPaymentInfo?.required ? `Write Story — KES ${storyPaymentInfo.amount}` : "Write a Story"}
                  </Button>
                  <Button variant="sage" size="sm" onClick={() => setShowFlowerDialog(true)} className="gap-1">
                    <Flower2 className="w-4 h-4" />
                    Offer a Flower
                  </Button>
                </>
              ) : (() => {
                const url = new URL(window.location.href);
                const fromPayment = url.searchParams.get('trxref') || url.searchParams.get('reference');
                if (fromPayment) {
                  return (
                    <Button variant="outline" size="sm" disabled className="gap-1 animate-pulse">
                      <CreditCard className="w-4 h-4" />
                      ⏳ Confirming Payment...
                    </Button>
                  );
                }
                return isOwner ? (
                  <Button variant="hero" size="sm" onClick={activateMemorial} disabled={activating} className="gap-1">
                    <CreditCard className="w-4 h-4" />
                    {activating ? "Processing..." : "Activate Page — KES 100/year"}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="gap-1 opacity-60">
                    <Lock className="w-4 h-4" />
                    Page Not Active
                  </Button>
                );
              })()}
            </div>

            {/* Story payment info */}
            {isActive && storyPaymentInfo && user && (
              <div className="mt-3 text-xs text-muted-foreground font-body">
                {storyPaymentInfo.required ? (
                  <span className="text-warm">⚠️ Your next story requires a payment of KES {storyPaymentInfo.amount}. After payment, you get 2 free stories.</span>
                ) : (
                  <span>✅ {storyPaymentInfo.freeRemaining} free stor{storyPaymentInfo.freeRemaining !== 1 ? "ies" : "y"} remaining. Next payment: KES {storyPaymentInfo.amount}</span>
                )}
              </div>
            )}
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

          {/* Tribute Garden */}
          <TributeGarden memorialId={id!} />

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
                const storyReactions = reactions[story.id] || [];
                const isEditing = editingStory === story.id;
                const canEdit = user?.id === story.author_id && (story.edit_count || 0) < 2;

                return (
                  <motion.div
                    key={story.id}
                    className="bg-card border border-border rounded-xl p-6"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-md">{typeInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && !isEditing && (
                          <button onClick={() => startEdit(story)} className="text-xs text-muted-foreground hover:text-primary font-body flex items-center gap-1">
                            <Edit className="w-3 h-3" /> Edit ({2 - (story.edit_count || 0)} left)
                          </button>
                        )}
                        {user && user.id !== story.author_id && (
                          <button
                            onClick={() => reportContent("story", story.id, "Reported by user")}
                            className="text-xs text-muted-foreground hover:text-destructive font-body"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                        <Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} className="min-h-[100px]" />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingStory(null)}>Cancel</Button>
                          <Button variant="hero" size="sm" onClick={() => submitEdit(story.id, story.edit_count || 0)} disabled={submitting}>
                            {submitting ? "Saving..." : "Save Edit"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-display text-base font-semibold text-foreground mb-2">{story.title}</h4>
                        <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">{story.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-muted-foreground font-body">
                            {story.profiles?.country && <span className="mr-1">{getFlag(story.profiles.country)}</span>}
                            — {story.profiles?.display_name || story.profiles?.username || "Anonymous"} · {new Date(story.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {/* Reactions */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {reactionTypes.map(rt => {
                            const count = storyReactions.filter(r => r.reaction_type === rt.type).length;
                            const userReacted = user && storyReactions.some(r => r.reaction_type === rt.type && r.user_id === user.id);
                            return (
                              <button
                                key={rt.type}
                                onClick={() => toggleReaction(story.id, rt.type)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${
                                  userReacted ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                              >
                                <span>{rt.emoji}</span>
                                <span>{rt.label}</span>
                                {count > 0 && <span className="font-medium">({count})</span>}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />

      {/* Flower Tribute Dialog */}
      <FlowerTributeDialog
        open={showFlowerDialog}
        onOpenChange={setShowFlowerDialog}
        memorialId={id!}
        memorialName={memorial.full_name}
      />
    </div>
  );
};

export default MemorialPage;

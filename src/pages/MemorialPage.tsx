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
import { Heart, BookOpen, Users, PenLine, Mail, Lightbulb, MessageCircle, Edit, Flag, CreditCard, Lock, Flower2, Shield, Save } from "lucide-react";
import { getFlag } from "@/lib/countries";
import FlowerTributeDialog from "@/components/memorial/FlowerTributeDialog";
import JourneyTimeline from "@/components/memorial/JourneyTimeline";
import MemorialServiceInfo from "@/components/memorial/MemorialServiceInfo";
import CherishedMemories from "@/components/memorial/CherishedMemories";
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
  const { user, isAdmin } = useAuth();
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
  const [editingMemorial, setEditingMemorial] = useState(false);
  const [memorialEditForm, setMemorialEditForm] = useState({
    full_name: "", personality_summary: "", common_phrase: "", life_lesson: "",
    unforgettable_moment: "", what_to_remember: "", relationship_to_creator: "",
  });

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

  // Admin: activate page without payment
  const adminActivate = async () => {
    if (!isAdmin) return;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const { error } = await supabase.from("memorial_pages").update({
      status: "active" as any,
      activation_expiry: expiry.toISOString(),
    }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMemorial((prev: any) => ({ ...prev, status: 'active', activation_expiry: expiry.toISOString() }));
      toast({ title: "✅ Page activated by admin" });
    }
  };

  const checkStoryLimits = async () => {
    if (!user || !id) return;
    if (isAdmin) {
      setStoryPaymentInfo({ required: false, amount: 0, freeRemaining: 999 });
      return;
    }
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

  useEffect(() => { if (id) loadAll(); }, [id]);
  useEffect(() => { if (user && id) checkStoryLimits(); }, [user, id, stories.length]);

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
    if (!isActive && !isAdmin) { toast({ title: "This memorial page must be activated first", variant: "destructive" }); return; }

    // Check story limits directly (don't rely on stale state)
    if (!isAdmin) {
      const { count } = await supabase.from("stories").select("id", { count: "exact", head: true })
        .eq("author_id", user.id).eq("memorial_id", id);
      const storyCount = count || 0;
      const positionInGroup = storyCount % 3;
      const groupNumber = Math.floor(storyCount / 3);

      if (positionInGroup === 2) {
        const amount = 250 + (groupNumber * 250);
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
    }

    setShowStoryForm(!showStoryForm);
  };

  const submitStory = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!isActive && !isAdmin) { toast({ title: "This memorial page must be activated before posting stories", variant: "destructive" }); return; }
    if (!storyForm.title || !storyForm.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }

    if (storyPaymentInfo?.required && !isAdmin) {
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
      // Update state locally without reloading
      setReactions(prev => ({
        ...prev,
        [storyId]: (prev[storyId] || []).filter(r => r.id !== existing.id),
      }));
    } else {
      const { data: newReaction } = await supabase.from("story_reactions")
        .insert({ story_id: storyId, user_id: user.id, reaction_type: reactionType as any })
        .select()
        .single();
      if (newReaction) {
        setReactions(prev => ({
          ...prev,
          [storyId]: [...(prev[storyId] || []), newReaction],
        }));
      }
    }
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

  const getRelationshipDisplay = () => {
    const rel = memorial?.relationship_to_creator;
    if (!rel) return "";
    const standardRels = ["father", "mother", "brother", "sister", "friend", "colleague", "teacher", "partner", "mentor", "spouse"];
    if (standardRels.includes(rel)) {
      return `Remembered by their ${rel}`;
    }
    return `Remembered by ${rel}`;
  };

  // Memorial editing
  const startMemorialEdit = () => {
    setMemorialEditForm({
      full_name: memorial.full_name || "",
      personality_summary: memorial.personality_summary || "",
      common_phrase: memorial.common_phrase || "",
      life_lesson: memorial.life_lesson || "",
      unforgettable_moment: memorial.unforgettable_moment || "",
      what_to_remember: memorial.what_to_remember || "",
      relationship_to_creator: memorial.relationship_to_creator || "",
    });
    setEditingMemorial(true);
  };

  const saveMemorialEdit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("memorial_pages").update({
      full_name: memorialEditForm.full_name,
      personality_summary: memorialEditForm.personality_summary || null,
      common_phrase: memorialEditForm.common_phrase || null,
      life_lesson: memorialEditForm.life_lesson || null,
      unforgettable_moment: memorialEditForm.unforgettable_moment || null,
      what_to_remember: memorialEditForm.what_to_remember || null,
      relationship_to_creator: memorialEditForm.relationship_to_creator,
    }).eq("id", id);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Memorial updated!" });
      setEditingMemorial(false);
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
            {/* Status badge - only visible to owner/admin, never show "Active" text */}
            {(isOwner || isAdmin) && !isActive && (() => {
              const url = new URL(window.location.href);
              const fromPayment = url.searchParams.get('trxref') || url.searchParams.get('reference');
              const isPending = memorial.status === 'inactive' && fromPayment;
              return (
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-body mb-4 ${
                  isPending ? 'bg-warm/20 text-warm animate-pulse' :
                  memorial.status === 'community' ? 'bg-primary/20 text-primary' :
                  'bg-accent text-accent-foreground'
                }`}>
                  {isPending ? '⏳ Activating... Payment being confirmed' :
                   memorial.status === 'community' ? '🔵 Community Page' :
                   '⚪ Page Not Yet Activated'}
                </div>
              );
            })()}

            {/* Memorial edit mode */}
            {editingMemorial ? (
              <div className="space-y-4 text-left mb-6">
                <div>
                  <label className="text-xs font-body text-muted-foreground">Full Name</label>
                  <Input value={memorialEditForm.full_name} onChange={e => setMemorialEditForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">Relationship (e.g. "their uncle John")</label>
                  <Input value={memorialEditForm.relationship_to_creator} onChange={e => setMemorialEditForm(f => ({ ...f, relationship_to_creator: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">Personality</label>
                  <Textarea value={memorialEditForm.personality_summary} onChange={e => setMemorialEditForm(f => ({ ...f, personality_summary: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">They Used to Say</label>
                  <Input value={memorialEditForm.common_phrase} onChange={e => setMemorialEditForm(f => ({ ...f, common_phrase: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">Life Lesson</label>
                  <Textarea value={memorialEditForm.life_lesson} onChange={e => setMemorialEditForm(f => ({ ...f, life_lesson: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">Unforgettable Moment</label>
                  <Textarea value={memorialEditForm.unforgettable_moment} onChange={e => setMemorialEditForm(f => ({ ...f, unforgettable_moment: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground">What to Remember</label>
                  <Textarea value={memorialEditForm.what_to_remember} onChange={e => setMemorialEditForm(f => ({ ...f, what_to_remember: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditingMemorial(false)}>Cancel</Button>
                  <Button variant="hero" size="sm" onClick={saveMemorialEdit} disabled={submitting} className="gap-1">
                    <Save className="w-4 h-4" /> {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-4xl font-bold text-foreground mb-1">{memorial.full_name}</h1>
                <p className="text-muted-foreground font-body">{memorial.birth_year} – {memorial.death_year}</p>
                <p className="text-sm text-muted-foreground font-body mt-1 capitalize">{getRelationshipDisplay()}</p>

                <div className="flex items-center justify-center gap-6 mt-4">
                  <span className="text-xs text-muted-foreground font-body">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
                  <span className="text-xs text-muted-foreground font-body">{followers} followers</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <Button variant={isFollowing ? "outline" : "warm"} size="sm" onClick={toggleFollow} className="gap-1">
                <Users className="w-4 h-4" />
                {isFollowing ? "Following" : "Follow"}
              </Button>

              {/* Edit button for owner/admin */}
              {(isOwner || isAdmin) && !editingMemorial && (
                <Button variant="outline" size="sm" onClick={startMemorialEdit} className="gap-1">
                  <Edit className="w-4 h-4" /> Edit Page
                </Button>
              )}

              {isActive || isAdmin ? (
                <>
                  <Button variant="hero" size="sm" onClick={handleWriteStory} className="gap-1">
                    <PenLine className="w-4 h-4" />
                    {storyPaymentInfo?.required && !isAdmin ? `Write Story — KES ${storyPaymentInfo.amount}` : "Write a Story"}
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
                // Only owner sees activate button; visitors don't see inactive status at all
                return isOwner ? (
                  <>
                    <Button variant="hero" size="sm" onClick={activateMemorial} disabled={activating} className="gap-1">
                      <CreditCard className="w-4 h-4" />
                      {activating ? "Processing..." : "Activate Page — KES 100/year"}
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={adminActivate} className="gap-1">
                        <Shield className="w-4 h-4" /> Admin Activate (Free)
                      </Button>
                    )}
                  </>
                ) : null;
              })()}

              {/* Admin activate for non-owner admin */}
              {!isActive && isAdmin && !isOwner && (
                <Button variant="outline" size="sm" onClick={adminActivate} className="gap-1">
                  <Shield className="w-4 h-4" /> Admin Activate (Free)
                </Button>
              )}
            </div>

            {/* Story payment info */}
            {isActive && storyPaymentInfo && user && !isAdmin && (
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
          {!editingMemorial && (
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
              {memorial.what_to_remember && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-display text-sm font-semibold text-foreground mb-2">What to Remember</h3>
                  <p className="text-sm text-foreground/80 font-body leading-relaxed">{memorial.what_to_remember}</p>
                </div>
              )}
            </div>
          )}

          {/* Journey Timeline */}
          <JourneyTimeline
            memorialId={id!}
            memorialName={memorial.full_name}
            birthYear={memorial.birth_year}
            deathYear={memorial.death_year}
            isOwner={isOwner}
          />

          {/* Memorial Service Info */}
          <MemorialServiceInfo
            memorialId={id!}
            memorialName={memorial.full_name}
            birthYear={memorial.birth_year}
            deathYear={memorial.death_year}
            isOwner={isOwner}
          />

          {/* Cherished Memories / Photos */}
          <CherishedMemories memorialId={id!} isActive={isActive} />

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
                const isEditingThis = editingStory === story.id;
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
                        {canEdit && !isEditingThis && (
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

                    {isEditingThis ? (
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

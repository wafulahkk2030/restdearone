import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Users, PenLine, BookOpen, Crown, ArrowRight, Heart, Shield, Lock } from "lucide-react";
import { getFlag } from "@/lib/countries";

const onboardingQuestions = [
  {
    question: "Who are you remembering?",
    options: ["Mother", "Father", "Both parents", "Guardian", "Friend", "Teacher", "Someone who raised me", "Other"],
  },
  {
    question: "How long has it been since they passed?",
    options: ["Less than 1 year", "1–3 years", "3–10 years", "More than 10 years"],
  },
  {
    question: "What kind of stories do you want to read or share?",
    options: ["Beautiful memories", "Life lessons they taught", "Letters to them", "Moments I miss most"],
    multi: true,
  },
];

const CommunityPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<number, string[]>>({});
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyForm, setStoryForm] = useState({ title: "", content: "", story_type: "memory" });
  const [submitting, setSubmitting] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const isMember = !!membership || isAdmin;

  useEffect(() => { if (id) loadAll(); }, [id, user]);

  const loadAll = async () => {
    setLoading(true);
    const [comRes, membersRes] = await Promise.all([
      supabase.from("community_groups").select("*").eq("id", id).single(),
      supabase.from("community_members").select("*").eq("community_id", id),
    ]);
    setCommunity(comRes.data);
    let membersList: any[] = membersRes.data || [];
    if (membersList.length > 0) {
      const ids = [...new Set(membersList.map((m: any) => m.user_id))];
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, display_name, username, country, avatar_url")
        .in("id", ids);
      const pmap = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
      membersList = membersList.map((m: any) => ({ ...m, profiles: pmap[m.user_id] || {} }));
    }
    setMembers(membersList);

    let mem = null;
    if (user) {
      mem = (membersRes.data || []).find((m: any) => m.user_id === user.id);
      setMembership(mem || null);
    }

    // Only load stories if member or admin
    if (mem || isAdmin) {
      const { data: storiesData } = await supabase
        .from("community_stories")
        .select("*, profiles:author_id(display_name, username, country)")
        .eq("community_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      setStories(storiesData || []);
    } else {
      setStories([]);
    }
    setLoading(false);
  };

  const isGroupAdmin = membership?.role === "admin" || isAdmin;

  const handleJoin = () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); navigate("/login"); return; }
    setShowOnboarding(true);
    setOnboardingStep(0);
    setOnboardingAnswers({});
  };

  const selectAnswer = (stepIdx: number, answer: string) => {
    const isMulti = onboardingQuestions[stepIdx]?.multi;
    setOnboardingAnswers(prev => {
      const current = prev[stepIdx] || [];
      if (isMulti) {
        return { ...prev, [stepIdx]: current.includes(answer) ? current.filter(a => a !== answer) : [...current, answer] };
      }
      return { ...prev, [stepIdx]: [answer] };
    });
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const { error } = await supabase.from("community_members").insert({
      community_id: id,
      user_id: user.id,
      role: "member",
      onboarding_answers: onboardingAnswers,
    });
    if (error) {
      if (error.message.includes("duplicate")) {
        toast({ title: "You're already a member!", description: "Refreshing..." });
      } else {
        toast({ title: "Error joining", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      supabase.functions.invoke("ai-tracking", {
        body: { action: "track_activity", data: { user_id: user.id, event_type: "community_joined", metadata: { community_id: id } } },
      });
      toast({ title: "Welcome!", description: "You've joined the community." });
    }
    setShowOnboarding(false);
    loadAll();
  };

  const submitStory = async () => {
    if (!user) return;
    if (!storyForm.title || !storyForm.content) { toast({ title: "Title and content required", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("community_stories").insert({
      community_id: id,
      author_id: user.id,
      title: storyForm.title,
      content: storyForm.content,
      story_type: storyForm.story_type,
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

  const removeMember = async (memberId: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("community_members").delete().eq("id", memberId);
    toast({ title: "Member removed" });
    loadAll();
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div></div>
  );

  if (!community) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Community not found.</p></div></div>
  );

  // Full-screen onboarding flow
  if (showOnboarding) {
    const isAffirmation = onboardingStep >= onboardingQuestions.length;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {!isAffirmation ? (
            <motion.div key={onboardingStep} className="max-w-md w-full text-center" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <p className="text-xs text-muted-foreground font-body mb-2">Step {onboardingStep + 1} of {onboardingQuestions.length}</p>
              <h2 className="font-display text-2xl font-bold text-foreground mb-8">{onboardingQuestions[onboardingStep].question}</h2>
              <div className="space-y-3">
                {onboardingQuestions[onboardingStep].options.map(opt => {
                  const selected = (onboardingAnswers[onboardingStep] || []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(onboardingStep, opt)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-body border transition-all ${
                        selected ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-8">
                {onboardingStep > 0 && <Button variant="outline" onClick={() => setOnboardingStep(s => s - 1)}>Back</Button>}
                <Button
                  variant="hero"
                  className="ml-auto gap-1"
                  disabled={!(onboardingAnswers[onboardingStep]?.length)}
                  onClick={() => setOnboardingStep(s => s + 1)}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="affirmation" className="max-w-md w-full text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Heart className="w-12 h-12 text-warm mx-auto mb-6" />
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">"Your memories matter."</h2>
              <p className="text-muted-foreground font-body mb-8">
                Thousands of people here are preserving stories of the people who shaped their lives.
              </p>
              <Button variant="hero" size="lg" onClick={completeOnboarding}>Enter Community</Button>
              <button onClick={() => setShowOnboarding(false)} className="block mx-auto mt-4 text-xs text-muted-foreground font-body hover:text-foreground">Cancel</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-body bg-accent text-accent-foreground mb-4">
              <Crown className="w-3 h-3 text-warm" />
              {community.category?.replace(/_/g, ' ')}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{community.name}</h1>
            {community.description && <p className="text-muted-foreground font-body max-w-lg mx-auto mb-4">{community.description}</p>}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground font-body">
              <span>{members.length} members</span>
              {isMember && <span>{stories.length} stories</span>}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              {!isMember ? (
                <Button variant="hero" onClick={handleJoin} className="gap-1">
                  <Users className="w-4 h-4" /> Join Community
                </Button>
              ) : (
                <>
                  <Button variant="hero" size="sm" onClick={() => setShowStoryForm(!showStoryForm)} className="gap-1">
                    <PenLine className="w-4 h-4" /> Write a Story
                  </Button>
                  {isGroupAdmin && (
                    <Button variant="outline" size="sm" onClick={() => setShowMembers(!showMembers)} className="gap-1">
                      <Shield className="w-4 h-4" /> Manage Members
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Members panel (admin only) */}
          {showMembers && isGroupAdmin && (
            <motion.div className="bg-card border border-border rounded-xl p-6 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Members ({members.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFlag(m.profiles?.country)}</span>
                      <span className="font-body text-sm text-foreground">{m.profiles?.display_name || m.profiles?.username}</span>
                      {m.role === 'admin' && <span className="text-xs bg-warm/20 text-warm px-1.5 py-0.5 rounded font-body">Admin</span>}
                      <span className="text-xs text-muted-foreground font-body">Score: {m.ai_engagement_score || 0}</span>
                    </div>
                    {m.role !== 'admin' && isGroupAdmin && user?.id !== m.user_id && (
                      <Button variant="outline" size="sm" onClick={() => removeMember(m.id)} className="text-xs">Remove</Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Story form */}
          {showStoryForm && isMember && (
            <motion.div className="bg-card border border-border rounded-xl p-6 mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Share a Story</h3>
              <div className="space-y-4">
                <Input placeholder="Story title..." value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder="Share your reflection..." value={storyForm.content} onChange={e => setStoryForm(f => ({ ...f, content: e.target.value }))} className="min-h-[150px]" />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowStoryForm(false)}>Cancel</Button>
                  <Button variant="hero" onClick={submitStory} disabled={submitting}>{submitting ? "Sharing..." : "Share"}</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stories - gated for members only */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-semibold text-foreground">Community Stories</h3>
            {!isMember ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-body mb-2">Join this community to read and share stories.</p>
                <Button variant="hero" size="sm" onClick={handleJoin} className="gap-1">
                  <Users className="w-4 h-4" /> Join Community
                </Button>
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground font-body">No stories yet. Be the first to share.</p>
              </div>
            ) : stories.map((story, i) => (
              <motion.div key={story.id} className="bg-card border border-border rounded-xl p-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <h4 className="font-display text-base font-semibold text-foreground mb-2">{story.title}</h4>
                <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">{story.content}</p>
                <p className="text-xs text-muted-foreground font-body mt-3">
                  {story.profiles?.country && <span className="mr-1">{getFlag(story.profiles.country)}</span>}
                  — {story.profiles?.display_name || story.profiles?.username || "Anonymous"} · {new Date(story.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityPage;

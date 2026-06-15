import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Flag, ShieldCheck, Heart, Users, MapPin, Calendar, MessageCircle, ExternalLink, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NationalLegendDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [legend, setLegend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      // try slug then id
      let { data } = await supabase.from("national_legends").select("*").eq("slug", id).maybeSingle();
      if (!data) {
        const r = await supabase.from("national_legends").select("*").eq("id", id).maybeSingle();
        data = r.data;
      }
      setLegend(data);
      if (data) {
        const { data: cs } = await supabase
          .from("legend_contributions")
          .select("*")
          .eq("legend_id", data.id)
          .eq("status", "completed")
          .eq("contribution_type", "tribute")
          .order("created_at", { ascending: false })
          .limit(50);
        setContributions(cs || []);
        const { data: cms } = await supabase
          .from("legend_contributions")
          .select("id, contributor_name, message, created_at")
          .eq("legend_id", data.id)
          .eq("contribution_type", "comment")
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(200);
        setComments(cms || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const postComment = async () => {
    if (!legend) return;
    const text = commentText.trim();
    if (text.length < 2) { toast({ title: "Please write a short message", variant: "destructive" }); return; }
    setPostingComment(true);
    const display = commentName.trim() || "Anonymous";
    const { data, error } = await supabase.from("legend_contributions").insert({
      legend_id: legend.id,
      contributor_name: display,
      contribution_type: "comment",
      amount: 0,
      message: text,
      status: "completed",
    }).select("id, contributor_name, message, created_at").maybeSingle();
    setPostingComment(false);
    if (error) { toast({ title: "Could not post comment", description: error.message, variant: "destructive" }); return; }
    setComments((prev) => (data ? [data, ...prev] : prev));
    setCommentName(""); setCommentText("");
    toast({ title: "Thank you 🌿", description: "Your message has been shared." });
  };

  const submitTribute = async () => {
    if (!legend) return;
    const amt = parseInt(amount);
    if (!email || !email.includes("@")) { toast({ title: "Email required", variant: "destructive" }); return; }
    if (!amt || amt < (legend.flower_min_amount || 100)) {
      toast({ title: `Minimum amount is KES ${legend.flower_min_amount || 100}`, variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("legend_contributions").insert({
      legend_id: legend.id,
      contributor_name: name.trim() || "Anonymous",
      contributor_email: email.trim(),
      contribution_type: "tribute",
      amount: amt,
      message: message.trim() || null,
      status: "pending",
    });
    setSending(false);
    if (error) { toast({ title: "Could not record tribute", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Thank you 🌿", description: "Your tribute has been recorded. Payment processing coming soon." });
    setName(""); setEmail(""); setAmount(""); setMessage("");
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="pt-28 text-center text-muted-foreground">Loading…</div></div>;
  if (!legend) return <div className="min-h-screen bg-background"><Navbar /><div className="pt-28 text-center"><p className="text-muted-foreground">Legend not found.</p><Button onClick={() => navigate("/national-legends")} className="mt-4">Back</Button></div></div>;

  const totalRaised = contributions.reduce((s, c) => s + (c.amount || 0), 0);
  const target = legend.tribute_target_amount || 0;
  const pct = target > 0 ? Math.min(100, Math.round((totalRaised / target) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{legend.full_name} — National Legend | RestDearOne</title>
        <meta name="description" content={(legend.national_impact_summary || `Honoring ${legend.full_name}, a national legend.`).slice(0, 160)} />
        <link rel="canonical" href={`https://restdearone.lovable.app/national-legends/${legend.slug || legend.id}`} />
      </Helmet>
      <Navbar />

      {/* Hero banner */}
      <section className="relative pt-16">
        <div className="relative h-[40vh] md:h-[60vh] bg-muted overflow-hidden">
          {legend.banner_image_url ? (
            <img src={legend.banner_image_url} alt={legend.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-sage/20 to-warm/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:pb-12">
            <div className="max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm text-primary text-xs font-body tracking-widest uppercase">
                <Flag className="w-3 h-3" /> National Legend
                {legend.is_official && <span className="inline-flex items-center gap-1 ml-2 text-foreground/80"><ShieldCheck className="w-3 h-3" /> Official</span>}
              </motion.div>
              <h1 className="font-display text-3xl md:text-6xl font-bold text-foreground mt-3">{legend.full_name}</h1>
              {legend.title && <p className="text-base md:text-xl text-primary font-body mt-1">{legend.title}</p>}
              <p className="text-sm md:text-base text-muted-foreground font-body mt-2">{legend.birth_year ? `${legend.birth_year} – ` : ""}{legend.death_year}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {legend.national_impact_summary && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">National Impact</h2>
                <p className="text-muted-foreground font-body leading-relaxed whitespace-pre-line">{legend.national_impact_summary}</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {legend.cause_of_death && <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-1">Cause</div><div className="text-foreground font-body">{legend.cause_of_death}</div></div>}
              {legend.location && <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</div><div className="text-foreground font-body">{legend.location}</div></div>}
              {legend.date_of_death && <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground font-body mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</div><div className="text-foreground font-body">{new Date(legend.date_of_death).toLocaleDateString()}</div></div>}
            </div>
            {legend.biography && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">Biography</h2>
                <p className="text-muted-foreground font-body leading-relaxed whitespace-pre-line">{legend.biography}</p>
              </div>
            )}
            {Array.isArray(legend.quotes) && legend.quotes.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-3">In their words</h2>
                <div className="space-y-3">
                  {legend.quotes.map((q: string, i: number) => (
                    <blockquote key={i} className="border-l-4 border-primary/40 pl-4 italic text-foreground font-body">"{q}"</blockquote>
                  ))}
                </div>
              </div>
            )}
            {legend.video_embed_url && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                <iframe src={legend.video_embed_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Tribute video" />
              </div>
            )}
            {Array.isArray(legend.gallery_images) && legend.gallery_images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {legend.gallery_images.map((img: string, i: number) => (
                  <img key={i} src={img} alt={`${legend.full_name} ${i + 1}`} loading="lazy" className="w-full aspect-square object-cover rounded-xl" />
                ))}
              </div>
            )}
            {Array.isArray(legend.partner_organizations) && legend.partner_organizations.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Partner Organizations</h2>
                <div className="flex flex-wrap gap-2">
                  {legend.partner_organizations.map((p: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-card border border-border text-xs font-body text-foreground">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {legend.slug === "raila-odinga" && (
              <a
                href="https://railaodinga.go.ke/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm font-body transition-colors"
              >
                Visit the official Raila Odinga website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Public comment / tribute wall — open to everyone */}
            <div id="comments" className="pt-6 border-t border-border">
              <h2 className="font-display text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> A Nation Remembers
              </h2>
              <p className="text-sm text-muted-foreground font-body mb-5">
                Leave a message in honour of {legend.full_name}. Open to everyone — no sign-in needed.
              </p>
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <Input
                  placeholder="Your name (optional)"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  maxLength={80}
                />
                <Textarea
                  placeholder="Share a memory, condolence, or tribute…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <div className="flex justify-end">
                  <Button variant="hero" onClick={postComment} disabled={postingComment} className="gap-2">
                    <Send className="w-4 h-4" />
                    {postingComment ? "Posting…" : "Post message"}
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground font-body italic">Be the first to leave a tribute.</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="bg-card/60 border border-border rounded-xl p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-body font-semibold text-sm text-foreground">{c.contributor_name}</span>
                      <span className="text-xs text-muted-foreground font-body">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-body mt-1 whitespace-pre-line leading-relaxed">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tribute sidebar */}
          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Honor their memory</h3>
              {target > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-body text-muted-foreground"><span>Raised</span><span>KES {totalRaised.toLocaleString()} / {target.toLocaleString()}</span></div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground font-body mt-4">Minimum tribute KES {legend.flower_min_amount || 100}. Anyone can contribute — no sign-in needed.</p>
              <div className="space-y-2 mt-4">
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="email" placeholder="Email (for receipt)" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="number" placeholder={`Amount (KES, min ${legend.flower_min_amount || 100})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Textarea placeholder="A short message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
                <Button variant="hero" className="w-full" onClick={submitTribute} disabled={sending}>
                  {sending ? "Sending…" : "Send Tribute"}
                </Button>
              </div>
            </div>

            {contributions.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-display text-sm font-semibold text-foreground mb-3">Recent tributes</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {contributions.map((c) => (
                    <div key={c.id} className="text-xs font-body border-b border-border pb-2 last:border-0">
                      <div className="flex justify-between"><span className="text-foreground font-medium">{c.contributor_name}</span><span className="text-primary">KES {c.amount?.toLocaleString()}</span></div>
                      {c.message && <p className="text-muted-foreground mt-1 italic">"{c.message}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default NationalLegendDetail;
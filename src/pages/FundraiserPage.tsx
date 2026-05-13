import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Clock, TrendingUp, CheckCircle, Share2, Copy, Star, Users, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const FundraiserPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContribute, setShowContribute] = useState(false);
  const [amount, setAmount] = useState("");
  const [noteToFamily, setNoteToFamily] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ method: "mpesa", account: "" });
  const [payout, setPayout] = useState<any>(null);
  const [showShare, setShowShare] = useState(false);
  const contributionsEndRef = useRef<HTMLDivElement>(null);

  // Determine if this is a short_id link or UUID
  const isShortLink = id && id.length < 36;

  useEffect(() => { if (id) loadData(); }, [id]);

  // Track link click
  useEffect(() => {
    if (!id) return;
    const referrer = document.referrer || null;
    // We'll track after we have the fundraiser ID
  }, [id]);

  // Realtime updates
  useEffect(() => {
    if (!fundraiser?.id) return;
    const channel = supabase
      .channel(`fundraiser-${fundraiser.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fundraisers", filter: `id=eq.${fundraiser.id}` }, (payload) => {
        setFundraiser((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contributions", filter: `fundraiser_id=eq.${fundraiser.id}` }, (payload) => {
        if (payload.new.payment_status === "success") {
          setContributions(prev => [payload.new as any, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fundraiser?.id]);

  // Poll for payment confirmation
  useEffect(() => {
    if (!fundraiser?.id) return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("trxref") || url.searchParams.get("reference");
    if (!ref) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase.from("contributions").select("payment_status").eq("payment_reference", ref).single();
      if (data?.payment_status === "success") {
        clearInterval(interval);
        toast({ title: "🎉 Thank you for your support!", description: "Your contribution has been recorded." });
        url.searchParams.delete("trxref");
        url.searchParams.delete("reference");
        window.history.replaceState({}, "", url.pathname);
        loadData();
        // Prompt to share
        setTimeout(() => setShowShare(true), 2000);
      }
      if (attempts >= 15) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [fundraiser?.id]);

  const loadData = async () => {
    setLoading(true);
    let fundraiserData: any = null;

    if (isShortLink) {
      // Extract short_id from slug-shortid format
      const shortId = id!.split("-").pop();
      const { data } = await supabase.from("fundraisers").select("*").eq("short_id", shortId).single();
      fundraiserData = data;
    } else {
      const { data } = await supabase.from("fundraisers").select("*").eq("id", id).single();
      fundraiserData = data;
    }

    if (fundraiserData) {
      setFundraiser(fundraiserData);
      
      // Track link click
      await supabase.from("fundraiser_link_clicks").insert({
        fundraiser_id: fundraiserData.id,
        referrer: document.referrer || null,
      } as any);

      const [cRes, iRes] = await Promise.all([
        supabase.from("public_contributions").select("*").eq("fundraiser_id", fundraiserData.id).order("created_at", { ascending: false }),
        supabase.from("fundraiser_images").select("*").eq("fundraiser_id", fundraiserData.id).order("sort_order"),
      ]);
      setContributions(cRes.data || []);
      setImages(iRes.data || []);

      // Load private payout details — RLS ensures only owner/admin sees this
      if (user) {
        const { data: payoutData } = await supabase
          .from("fundraiser_payouts" as any)
          .select("*")
          .eq("fundraiser_id", fundraiserData.id)
          .maybeSingle();
        setPayout(payoutData || null);
      } else {
        setPayout(null);
      }
    }
    setLoading(false);
  };

  const handleContribute = async () => {
    if (!user) { toast({ title: "Please sign in to contribute", variant: "destructive" }); return; }
    const amt = parseInt(amount);
    if (!amt || amt < 50) { toast({ title: "Minimum contribution is KES 50", variant: "destructive" }); return; }
    setContributing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fundraising-engine", {
        body: {
          action: "contribute",
          fundraiser_id: fundraiser.id,
          amount: amt,
          is_anonymous: isAnonymous,
          note_to_family: noteToFamily || null,
        },
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
    setContributing(false);
  };

  const savePayoutDetails = async () => {
    if (!payoutForm.account) { toast({ title: "Please enter account details", variant: "destructive" }); return; }
    const { error } = await supabase.from("fundraiser_payouts" as any).upsert({
      fundraiser_id: fundraiser.id,
      payout_method: payoutForm.method,
      payout_account: payoutForm.account,
    }, { onConflict: "fundraiser_id" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout details saved!" });
      setShowPayoutForm(false);
      loadData();
    }
  };

  const shareUrl = fundraiser?.short_id
    ? `https://restdearone.com/support/${fundraiser.slug}-${fundraiser.short_id}`
    : `https://restdearone.com/fundraise/${fundraiser?.id}`;

  const shareText = `Help us support ${fundraiser?.title}. Every contribution matters.\n\n${shareUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!" });
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div>
    </div>
  );

  if (!fundraiser) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 text-center px-4">
        <p className="text-muted-foreground font-body text-lg">Fundraiser not found.</p>
      </div>
      <Footer />
    </div>
  );

  // If not active, show ended message
  if (fundraiser.status === "pending_approval") return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 text-center px-4">
        <p className="text-foreground font-display text-2xl font-bold mb-2">Under Review</p>
        <p className="text-muted-foreground font-body">This fundraiser is being reviewed by our team. It will go live once approved.</p>
      </div>
      <Footer />
    </div>
  );

  if (fundraiser.status === "rejected") return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 text-center px-4">
        <p className="text-foreground font-display text-2xl font-bold mb-2">Fundraiser Not Available</p>
        <p className="text-muted-foreground font-body">This fundraiser was not approved.</p>
      </div>
      <Footer />
    </div>
  );

  const pct = Math.min(100, Math.round((fundraiser.current_amount / fundraiser.target_amount) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(fundraiser.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isOwner = user?.id === fundraiser.created_by;
  const isClosed = !["active"].includes(fundraiser.status);
  const totalContributed = contributions.reduce((sum: number, c: any) => sum + c.gross_amount, 0);
  const isHighlighted = fundraiser.highlight_until && new Date(fundraiser.highlight_until) > new Date();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{fundraiser?.title ? `${fundraiser.title} — RestDearOne Fundraiser` : 'Fundraiser — RestDearOne'}</title>
        <meta name="description" content={fundraiser?.description ? `${fundraiser.description.slice(0, 155)}` : 'Support a family through a memorial fundraiser on RestDearOne.'} />
        <link rel="canonical" href={`https://restdearone.lovable.app/fundraise/${fundraiser?.id || id}`} />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header with images */}
            {images.length > 0 && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: any) => (
                    <img key={img.id} src={img.image_url} alt="" className="h-48 w-auto rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              {isHighlighted && (
                <div className="inline-flex items-center gap-1 text-xs text-primary font-body mb-2 bg-primary/10 px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" /> Community Spotlight
                </div>
              )}
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">{fundraiser.title}</h1>
              {fundraiser.relationship_to_deceased && (
                <p className="text-sm text-muted-foreground font-body">
                  Created by <span className="font-medium text-foreground">{fundraiser.relationship_to_deceased}</span>
                </p>
              )}
            </div>

            {/* Personal statement / story */}
            {fundraiser.personal_statement && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Their Story</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed whitespace-pre-wrap">{fundraiser.personal_statement}</p>
              </div>
            )}

            {fundraiser.description && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <p className="text-muted-foreground font-body leading-relaxed">{fundraiser.description}</p>
              </div>
            )}

            {/* Progress */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="w-full bg-muted rounded-full h-4 mb-4">
                <motion.div
                  className="bg-primary h-4 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between text-lg font-body">
                <span className="font-bold text-foreground">KES {fundraiser.current_amount?.toLocaleString()}</span>
                <span className="text-muted-foreground">of KES {fundraiser.target_amount?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {pct}% raised</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {daysLeft} days left</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {contributions.length} supporter{contributions.length !== 1 ? 's' : ''}</span>
                <span>Total: KES {totalContributed.toLocaleString()}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {!isClosed && (
                <Button variant="hero" size="lg" onClick={() => setShowContribute(true)} className="gap-1">
                  <Heart className="w-5 h-5" /> Support This Family
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowShare(true)} className="gap-1">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              {isOwner && !payout?.payout_account && (
                <Button variant="outline" onClick={() => setShowPayoutForm(true)}>
                  Add Payout Details
                </Button>
              )}
              {isOwner && fundraiser.status === "paid" && (
                <Button variant="sage" onClick={async () => {
                  await supabase.from("fundraisers").update({ status: "completed" }).eq("id", fundraiser.id);
                  toast({ title: "Receipt confirmed!" });
                  loadData();
                }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Confirm Receipt
                </Button>
              )}
            </div>

            {/* Payout info for owner — private, never shown to public */}
            {isOwner && payout?.payout_account && (
              <div className="bg-sage/10 border border-sage/20 rounded-xl p-4 mb-6 text-sm font-body">
                <p className="font-semibold text-foreground">Payout Details</p>
                <p className="text-muted-foreground">Method: {payout.payout_method?.toUpperCase()} — {payout.payout_account}</p>
              </div>
            )}

            {/* Transparency note */}
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-muted-foreground font-body">
                A small portion supports the platform. The full amount you see here has been contributed by supporters. Platform fees are deducted at payout.
              </p>
            </div>

            {/* Live Activity Feed */}
            <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Live Activity
            </h3>
            {contributions.length === 0 ? (
              <div className="text-center py-8 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground font-body">No contributions yet. Be the first to stand with this family!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {contributions.map((c: any, i: number) => (
                    <motion.div
                      key={c.id}
                      className="bg-card border border-border rounded-lg p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-body text-sm font-medium text-foreground">
                          {c.is_anonymous ? "Anonymous Supporter" : (c.donor_name || "Anonymous")}
                        </p>
                        <span className="font-body text-sm font-semibold text-primary">KES {c.gross_amount?.toLocaleString()}</span>
                      </div>
                      {c.note_to_family && (
                        <p className="text-xs text-muted-foreground font-body italic mt-1">"{c.note_to_family}"</p>
                      )}
                      <p className="font-body text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={contributionsEndRef} />
              </div>
            )}

            {/* Closed fundraiser message */}
            {isClosed && fundraiser.status !== "active" && (
              <div className="mt-8 text-center bg-card border border-border rounded-xl p-6">
                <p className="text-foreground font-display text-lg font-semibold">This fundraiser has ended.</p>
                <p className="text-muted-foreground font-body text-sm mt-1">Thank you for your support.</p>
                {fundraiser.status === "paid" && (
                  <p className="text-sm text-primary font-body mt-2">
                    KES {Math.round(fundraiser.current_amount * 0.905).toLocaleString()} sent to beneficiary
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />

      {/* Contribute dialog */}
      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Offer Support</DialogTitle>
            <DialogDescription className="font-body text-sm">
              100% of your contribution is recorded. Platform fees are deducted at payout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-body text-sm">Amount (KES)</Label>
              <Input type="number" placeholder="e.g. 1000" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" min="50" />
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2500, 5000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className={`px-3 py-1 rounded-lg text-xs font-body border transition-colors ${
                      amount === String(a) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                    }`}>
                    KES {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-body text-sm">Note to the family (optional)</Label>
              <Textarea placeholder="Your message of support..." value={noteToFamily} onChange={e => setNoteToFamily(e.target.value)} className="mt-1" maxLength={300} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(!!v)} />
              <label htmlFor="anonymous" className="text-sm font-body text-muted-foreground cursor-pointer">
                Contribute anonymously
              </label>
            </div>
            <Button variant="hero" className="w-full" onClick={handleContribute} disabled={contributing}>
              {contributing ? "Processing..." : "Support This Family"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Share This Fundraiser</DialogTitle>
            <DialogDescription className="font-body text-sm">Help spread the word and support this family.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button variant="outline" size="sm" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")}>
                WhatsApp
              </Button>
              <Button variant="outline" className="flex-1 text-sm" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}>
                Facebook
              </Button>
              <Button variant="outline" className="flex-1 text-sm" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank")}>
                X
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payout details dialog */}
      <Dialog open={showPayoutForm} onOpenChange={setShowPayoutForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Payout Details</DialogTitle>
            <DialogDescription className="font-body text-sm">Where should the funds be sent?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              {["mpesa", "bank"].map(m => (
                <button key={m} onClick={() => setPayoutForm(f => ({ ...f, method: m }))}
                  className={`px-4 py-2 rounded-lg text-sm font-body border ${payoutForm.method === m ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                  {m === "mpesa" ? "M-Pesa" : "Bank"}
                </button>
              ))}
            </div>
            <div>
              <Label className="font-body text-sm">{payoutForm.method === "mpesa" ? "M-Pesa Number" : "Bank Account Details"}</Label>
              <Input placeholder={payoutForm.method === "mpesa" ? "e.g. 0712345678" : "Bank name, account number"} value={payoutForm.account} onChange={e => setPayoutForm(f => ({ ...f, account: e.target.value }))} className="mt-1" />
            </div>
            <Button variant="hero" className="w-full" onClick={savePayoutDetails}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FundraiserPage;

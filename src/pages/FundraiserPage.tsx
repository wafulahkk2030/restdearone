import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Heart, Clock, TrendingUp, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const FundraiserPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContribute, setShowContribute] = useState(false);
  const [amount, setAmount] = useState("");
  const [contributing, setContributing] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ method: "mpesa", account: "" });

  useEffect(() => { if (id) loadData(); }, [id]);

  // Realtime updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`fundraiser-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fundraisers", filter: `id=eq.${id}` }, (payload) => {
        setFundraiser((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contributions", filter: `fundraiser_id=eq.${id}` }, (payload) => {
        if (payload.new.payment_status === "success") {
          setContributions(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Poll for payment confirmation
  useEffect(() => {
    if (!id) return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("trxref") || url.searchParams.get("reference");
    if (!ref) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase.from("contributions").select("payment_status").eq("payment_reference", ref).single();
      if (data?.payment_status === "success") {
        clearInterval(interval);
        toast({ title: "🎉 Contribution confirmed!", description: "Thank you for your generosity." });
        url.searchParams.delete("trxref");
        url.searchParams.delete("reference");
        window.history.replaceState({}, "", url.pathname);
        loadData();
      }
      if (attempts >= 15) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [fRes, cRes] = await Promise.all([
      supabase.from("fundraisers").select("*").eq("id", id).single(),
      supabase.from("contributions").select("*").eq("fundraiser_id", id).eq("payment_status", "success").order("created_at", { ascending: false }),
    ]);
    setFundraiser(fRes.data);
    setContributions(cRes.data || []);
    setLoading(false);
  };

  const handleContribute = async () => {
    if (!user) { toast({ title: "Please sign in to contribute", variant: "destructive" }); return; }
    const amt = parseInt(amount);
    if (!amt || amt < 50) { toast({ title: "Minimum contribution is KES 50", variant: "destructive" }); return; }
    setContributing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fundraising-engine", {
        body: { action: "contribute", fundraiser_id: id, amount: amt },
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
    const { error } = await supabase.from("fundraisers").update({
      payout_method: payoutForm.method,
      payout_account: payoutForm.account,
    }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout details saved!" });
      setShowPayoutForm(false);
      loadData();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div>
    </div>
  );

  if (!fundraiser) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Fundraiser not found.</p></div>
    </div>
  );

  const pct = Math.min(100, Math.round((fundraiser.current_amount / fundraiser.target_amount) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(fundraiser.deadline).getTime() - Date.now()) / (1000*60*60*24)));
  const isOwner = user?.id === fundraiser.created_by;
  const isClosed = fundraiser.status !== "active";

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Contributions now at", color: "text-primary" },
    closed: { label: "Fundraising ended", color: "text-warm" },
    paying: { label: "Payment in progress", color: "text-sage" },
    paid: { label: "✅ Confirm Receipt", color: "text-sage" },
  };
  const statusInfo = statusLabels[fundraiser.status] || statusLabels.active;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">{fundraiser.title}</h1>
              {fundraiser.description && <p className="text-muted-foreground font-body">{fundraiser.description}</p>}
              <p className={`text-sm font-body font-semibold mt-3 ${statusInfo.color}`}>{statusInfo.label}</p>
            </div>

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
                <span className="font-bold text-foreground">KES {fundraiser.current_amount.toLocaleString()}</span>
                <span className="text-muted-foreground">of KES {fundraiser.target_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {pct}% raised</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {daysLeft} days left</span>
              </div>
              <div className="text-xs text-muted-foreground font-body mt-2">{contributions.length} contribution(s)</div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {!isClosed && (
                <Button variant="hero" size="lg" onClick={() => setShowContribute(true)} className="gap-1">
                  <Heart className="w-5 h-5" /> Contribute
                </Button>
              )}
              {isOwner && !fundraiser.payout_account && (
                <Button variant="outline" onClick={() => setShowPayoutForm(true)}>
                  Add Payout Details
                </Button>
              )}
              {isOwner && fundraiser.status === "paid" && (
                <Button variant="sage" onClick={async () => {
                  await supabase.from("fundraisers").update({ status: "completed" }).eq("id", id);
                  toast({ title: "Receipt confirmed!" });
                  loadData();
                }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Confirm Receipt
                </Button>
              )}
            </div>

            {/* Payout info for owner */}
            {isOwner && fundraiser.payout_account && (
              <div className="bg-sage/10 border border-sage/20 rounded-xl p-4 mb-6 text-sm font-body">
                <p className="font-semibold text-foreground">Payout Details</p>
                <p className="text-muted-foreground">Method: {fundraiser.payout_method?.toUpperCase()} — {fundraiser.payout_account}</p>
              </div>
            )}

            {/* Recent contributions */}
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Contributions</h3>
            {contributions.length === 0 ? (
              <div className="text-center py-8 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground font-body">No contributions yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contributions.map((c, i) => (
                  <motion.div
                    key={c.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{c.donor_name || "Anonymous"}</p>
                      <p className="font-body text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-body text-sm font-semibold text-primary">KES {c.gross_amount.toLocaleString()}</span>
                  </motion.div>
                ))}
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
            <DialogTitle className="font-display">Contribute</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Platform retains 9.5% to sustain operations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-body text-sm">Amount (KES)</Label>
              <Input type="number" placeholder="e.g. 1000" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" min="50" />
              {amount && parseInt(amount) >= 50 && (
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Beneficiary receives: KES {Math.round(parseInt(amount) * 0.905).toLocaleString()} | Platform fee: KES {Math.round(parseInt(amount) * 0.095).toLocaleString()}
                </p>
              )}
            </div>
            <Button variant="hero" className="w-full" onClick={handleContribute} disabled={contributing}>
              {contributing ? "Processing..." : "Contribute Now"}
            </Button>
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { Heart, Plus, Target, Clock, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Fundraise = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_amount: "", deadline: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadFundraisers(); }, []);

  const loadFundraisers = async () => {
    setLoading(true);
    const { data } = await supabase.from("fundraisers").select("*").eq("status", "active").order("created_at", { ascending: false });
    setFundraisers(data || []);
    setLoading(false);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("fundraiser-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fundraisers" }, (payload) => {
        setFundraisers(prev => prev.map(f => f.id === payload.new.id ? { ...f, ...payload.new } : f));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreate = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!form.title || !form.target_amount || !form.deadline) {
      toast({ title: "Title, target amount, and deadline are required", variant: "destructive" }); return;
    }
    setCreating(true);
    const { error } = await supabase.from("fundraisers").insert({
      title: form.title,
      description: form.description || null,
      target_amount: parseInt(form.target_amount),
      deadline: new Date(form.deadline).toISOString(),
      created_by: user.id,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fundraiser created!" });
      setShowCreate(false);
      setForm({ title: "", description: "", target_amount: "", deadline: "" });
      loadFundraisers();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">Fundraise</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              Support families, honor legacies, and contribute to causes that matter. Every contribution is tracked live with full transparency.
            </p>
            <p className="text-xs text-muted-foreground font-body mt-2">Platform retains 9.5% to sustain operations. The rest goes directly to beneficiaries.</p>
          </motion.div>

          {user && (
            <div className="flex justify-center mb-8">
              <Button variant="hero" onClick={() => setShowCreate(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Create Fundraiser
              </Button>
            </div>
          )}

          {loading ? (
            <p className="text-center text-muted-foreground font-body">Loading fundraisers...</p>
          ) : fundraisers.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No active fundraisers yet. Be the first to start one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fundraisers.map(f => {
                const pct = Math.min(100, Math.round((f.current_amount / f.target_amount) * 100));
                const daysLeft = Math.max(0, Math.ceil((new Date(f.deadline).getTime() - Date.now()) / (1000*60*60*24)));
                return (
                  <Link key={f.id} to={`/fundraise/${f.id}`}>
                    <motion.div
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                      {f.description && <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{f.description}</p>}
                      
                      <div className="w-full bg-muted rounded-full h-3 mb-3">
                        <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm font-body">
                        <span className="font-semibold text-foreground">KES {f.current_amount.toLocaleString()}</span>
                        <span className="text-muted-foreground">of KES {f.target_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground font-body">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {pct}%</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {daysLeft} days left</span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create a Fundraiser</DialogTitle>
            <DialogDescription className="font-body text-sm">Start a fundraiser to support a family or cause.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-body text-sm">Title</Label>
              <Input placeholder="e.g. Support Brian's Family" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="font-body text-sm">Description</Label>
              <Textarea placeholder="Tell people about this cause..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 min-h-[100px]" />
            </div>
            <div>
              <Label className="font-body text-sm">Target Amount (KES)</Label>
              <Input type="number" placeholder="e.g. 50000" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="font-body text-sm">Deadline</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="mt-1" min={new Date().toISOString().split("T")[0]} />
            </div>
            <Button variant="hero" className="w-full" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Fundraiser"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fundraise;

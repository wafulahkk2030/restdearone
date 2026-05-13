import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
import { Heart, Plus, Clock, TrendingUp, Sparkles, Users, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RELATIONSHIPS = [
  "Son", "Daughter", "Parent", "Sibling", "Relative", "Friend", "Community Member", "Other"
];

const Fundraise = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    relationship: "",
    custom_relationship: "",
    personal_statement: "",
    memorial_id: "",
    title: "",
    description: "",
    target_amount: "",
    deadline: "",
  });
  const [creating, setCreating] = useState(false);
  const [memorials, setMemorials] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadFundraisers(); }, []);

  useEffect(() => {
    if (user && showCreate) {
      supabase.from("memorial_pages").select("id, full_name").order("created_at", { ascending: false }).then(({ data }) => {
        setMemorials(data || []);
      });
    }
  }, [user, showCreate]);

  const loadFundraisers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("fundraisers")
      .select("*")
      .eq("status", "active")
      .order("highlight_until", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setFundraisers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel("fundraiser-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fundraisers" }, (payload) => {
        setFundraisers(prev => prev.map(f => f.id === payload.new.id ? { ...f, ...payload.new } : f));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");

  const handleCreate = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!form.title || !form.target_amount || !form.deadline || !form.relationship || !form.personal_statement) {
      toast({ title: "All required fields must be filled", variant: "destructive" }); return;
    }
    setCreating(true);

    const shortId = crypto.randomUUID().slice(0, 5);
    const slug = slugify(form.title);
    const relationship = form.relationship === "Other" ? form.custom_relationship : form.relationship;

    const { data: newFundraiser, error } = await supabase.from("fundraisers").insert({
      title: form.title,
      description: form.description || null,
      target_amount: parseInt(form.target_amount),
      deadline: new Date(form.deadline).toISOString(),
      created_by: user.id,
      relationship_to_deceased: relationship,
      personal_statement: form.personal_statement,
      memorial_id: form.memorial_id || null,
      slug,
      short_id: shortId,
      status: "pending_approval",
    } as any).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    // Upload images
    if (images.length > 0 && newFundraiser) {
      setUploading(true);
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const file = images[i];
        const filePath = `${user.id}/${newFundraiser.id}/${Date.now()}_${i}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from("fundraiser-images").upload(filePath, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("fundraiser-images").getPublicUrl(filePath);
          await supabase.from("fundraiser_images").insert({
            fundraiser_id: newFundraiser.id,
            image_url: urlData.publicUrl,
            uploaded_by: user.id,
            sort_order: i,
          } as any);
        }
      }
      setUploading(false);
    }

    setCreating(false);
    toast({ title: "Fundraiser submitted for review!", description: "An admin will review and approve your fundraiser shortly." });
    setShowCreate(false);
    setStep(1);
    setForm({ relationship: "", custom_relationship: "", personal_statement: "", memorial_id: "", title: "", description: "", target_amount: "", deadline: "" });
    setImages([]);
  };

  const isHighlighted = (f: any) => f.highlight_until && new Date(f.highlight_until) > new Date();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Start a Fundraiser — RestDearOne</title>
        <meta name="description" content="Start a fundraiser to support a family in need. Create and manage memorial fundraising campaigns." />
        <link rel="canonical" href="https://restdearone.lovable.app/fundraise" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">Support a Family</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              People coming together to honor a life and support those left behind. Every contribution matters.
            </p>
          </motion.div>

          {user && (
            <div className="flex justify-center mb-8">
              <Button variant="hero" onClick={() => setShowCreate(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Start a Fundraiser
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
            <div className="space-y-8">
              {/* Community Spotlight */}
              {fundraisers.some(f => isHighlighted(f)) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">Community Spotlight</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fundraisers.filter(f => isHighlighted(f)).map(f => (
                      <FundraiserCard key={f.id} f={f} highlighted />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular fundraisers */}
              <div>
                {fundraisers.some(f => isHighlighted(f)) && (
                  <h2 className="font-display text-lg font-semibold text-foreground mb-4">All Fundraisers</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fundraisers.filter(f => !isHighlighted(f)).map(f => (
                    <FundraiserCard key={f.id} f={f} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Create Dialog - Multi-step */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setStep(1); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Start a Fundraiser — Step {step}/5</DialogTitle>
            <DialogDescription className="font-body text-sm">
              {step === 1 && "Tell us your relationship to the deceased."}
              {step === 2 && "Share why this fundraiser matters."}
              {step === 3 && "Link to a memorial page (optional)."}
              {step === 4 && "Upload images (max 5)."}
              {step === 5 && "Set your fundraiser details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {step === 1 && (
              <>
                <div>
                  <Label className="font-body text-sm">Who are you to the deceased? *</Label>
                  <Select value={form.relationship} onValueChange={v => setForm(f => ({ ...f, relationship: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.relationship === "Other" && (
                  <Input placeholder="Specify your relationship" value={form.custom_relationship} onChange={e => setForm(f => ({ ...f, custom_relationship: e.target.value }))} />
                )}
                <Button variant="hero" className="w-full" onClick={() => {
                  if (!form.relationship || (form.relationship === "Other" && !form.custom_relationship)) {
                    toast({ title: "Please select a relationship", variant: "destructive" }); return;
                  }
                  setStep(2);
                }}>Next</Button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label className="font-body text-sm">Tell us about your relationship and why this fundraiser matters *</Label>
                  <Textarea placeholder="Share your story..." value={form.personal_statement} onChange={e => setForm(f => ({ ...f, personal_statement: e.target.value }))} className="mt-1 min-h-[120px]" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button variant="hero" className="flex-1" onClick={() => {
                    if (!form.personal_statement || form.personal_statement.length < 20) {
                      toast({ title: "Please write at least 20 characters", variant: "destructive" }); return;
                    }
                    setStep(3);
                  }}>Next</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label className="font-body text-sm">Link to Memorial Page (optional)</Label>
                  <Select value={form.memorial_id} onValueChange={v => setForm(f => ({ ...f, memorial_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select a memorial page" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No memorial link</SelectItem>
                      {memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Linking to a memorial builds trust.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                  <Button variant="hero" className="flex-1" onClick={() => setStep(4)}>Next</Button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <Label className="font-body text-sm">Upload Images (max 5)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []).slice(0, 5);
                      setImages(files);
                    }}
                    className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {images.map((img, i) => (
                        <img key={i} src={URL.createObjectURL(img)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Images help humanize your fundraiser and build trust.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                  <Button variant="hero" className="flex-1" onClick={() => setStep(5)}>Next</Button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div>
                  <Label className="font-body text-sm">Fundraiser Title *</Label>
                  <Input placeholder="e.g. Support Brian's Family" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="font-body text-sm">Description</Label>
                  <Textarea placeholder="Tell people about this cause..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 min-h-[80px]" />
                </div>
                <div>
                  <Label className="font-body text-sm">Target Amount (KES) *</Label>
                  <Input type="number" placeholder="e.g. 50000" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="font-body text-sm">Deadline *</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="mt-1" min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Back</Button>
                  <Button variant="hero" className="flex-1" onClick={handleCreate} disabled={creating || uploading}>
                    {creating || uploading ? "Submitting..." : "Submit for Review"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">Your fundraiser will be reviewed by an admin before going live.</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FundraiserCard = ({ f, highlighted }: { f: any; highlighted?: boolean }) => {
  const pct = Math.min(100, Math.round((f.current_amount / f.target_amount) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(f.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const linkPath = f.short_id ? `/support/${f.slug}-${f.short_id}` : `/fundraise/${f.id}`;

  return (
    <Link to={linkPath}>
      <motion.div
        className={`bg-card border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer ${
          highlighted ? "border-primary/40 shadow-sm ring-1 ring-primary/20" : "border-border"
        }`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {highlighted && (
          <div className="flex items-center gap-1 text-xs text-primary font-body mb-2">
            <Star className="w-3 h-3" /> Community Spotlight
          </div>
        )}
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
        {f.relationship_to_deceased && (
          <p className="text-xs text-muted-foreground font-body mb-1">Created by {f.relationship_to_deceased}</p>
        )}
        {f.description && <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{f.description}</p>}

        <div className="w-full bg-muted rounded-full h-3 mb-3">
          <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center justify-between text-sm font-body">
          <span className="font-semibold text-foreground">KES {f.current_amount?.toLocaleString()}</span>
          <span className="text-muted-foreground">of KES {f.target_amount?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {pct}%</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {daysLeft} days left</span>
        </div>
      </motion.div>
    </Link>
  );
};

export default Fundraise;

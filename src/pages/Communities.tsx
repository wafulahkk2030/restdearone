import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Users, Plus, BookOpen, Crown } from "lucide-react";

const Communities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "life_lessons", customCategory: "" });

  useEffect(() => { loadCommunities(); }, []);

  const loadCommunities = async () => {
    setLoading(true);
    const { data } = await supabase.from("community_groups").select("*").eq("is_active", true).order("member_count", { ascending: false });
    setCommunities(data || []);
    setLoading(false);
  };

  const createCommunity = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }

    // Check community limits based on platform size
    const totalCommunities = communities.length;
    const maxAllowed = totalCommunities < 1000 ? 25 : totalCommunities < 2000 ? 30 : 40;
    const { count: userCount } = await supabase.from("community_groups").select("id", { count: "exact", head: true }).eq("created_by", user.id);
    if ((userCount || 0) >= 5) {
      toast({ title: "You can create a maximum of 5 communities", variant: "destructive" });
      return;
    }

    setCreating(true);
    const category = form.category === "other" ? (form.customCategory || "other") : form.category;
    
    // Create community first (inactive until paid)
    const { data, error } = await supabase.from("community_groups").insert({
      name: form.name,
      description: form.description,
      category,
      created_by: user.id,
      is_active: false,
    }).select().single();
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    // Add creator as admin member
    await supabase.from("community_members").insert({
      community_id: data.id,
      user_id: user.id,
      role: "admin",
    });

    // Initialize payment
    try {
      const { data: payData, error: payError } = await supabase.functions.invoke("initialize-payment", {
        body: { type: "community", community_id: data.id, billing_cycle: "monthly" },
      });
      if (payError) throw payError;
      if (payData?.authorization_url) {
        window.location.href = payData.authorization_url;
        return;
      }
      throw new Error("No payment URL received");
    } catch (err: any) {
      toast({ title: "Community created but payment failed", description: err.message + ". Go to your dashboard to retry payment.", variant: "destructive" });
      navigate(`/community/${data.id}`);
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Memory Communities</h1>
            <p className="text-muted-foreground font-body max-w-lg mx-auto mb-6">
              Join circles of shared experience. Find others who understand your journey.
            </p>
            <Button variant="hero" onClick={() => setShowCreate(!showCreate)} className="gap-1">
              <Plus className="w-4 h-4" /> Create a Community
            </Button>
            <p className="text-xs text-muted-foreground font-body mt-2">KES 500/month or $5/month to host a community</p>
          </motion.div>

          {showCreate && (
            <motion.div className="bg-card border border-border rounded-xl p-6 mb-8 max-w-lg mx-auto" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Create Your Community</h3>
              <div className="space-y-4">
                <div>
                  <Label className="font-body text-sm">Community Name</Label>
                  <Input placeholder="e.g. Losing a Parent" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="font-body text-sm">Description</Label>
                  <Textarea placeholder="What is this community about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="font-body text-sm">Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
                  >
                    <option value="losing_a_parent">Losing a Parent</option>
                    <option value="losing_a_friend">Losing a Friend</option>
                    <option value="losing_a_spouse">Losing a Spouse</option>
                    <option value="losing_a_child">Losing a Child</option>
                    <option value="losing_a_sibling">Losing a Sibling</option>
                    <option value="sudden_loss">Sudden Loss</option>
                    <option value="community_heroes">Community Heroes</option>
                    <option value="life_lessons">Life Lessons</option>
                    <option value="remembering_teachers">Remembering Teachers</option>
                    <option value="celebrating_life">Celebrating Life</option>
                    <option value="family_memories">Family Memories</option>
                    <option value="workplace_memories">Workplace Memories</option>
                    <option value="childhood_memories">Childhood Memories</option>
                    <option value="faith_and_spirituality">Faith & Spirituality</option>
                    <option value="military_and_service">Military & Service</option>
                    <option value="other">Other</option>
                  </select>
                  {form.category === "other" && (
                    <Input
                      placeholder="Describe your community category"
                      value={form.customCategory || ""}
                      onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))}
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button variant="hero" onClick={createCommunity} disabled={creating}>
                    {creating ? "Creating..." : "Create Community"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {loading ? (
            <p className="text-center text-muted-foreground font-body">Loading communities...</p>
          ) : communities.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground font-body">No communities yet. Be the first to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communities.map((c, i) => (
                <Link key={c.id} to={`/community/${c.id}`}>
                  <motion.div
                    className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="w-4 h-4 text-warm" />
                      <span className="text-xs font-body font-medium bg-accent text-accent-foreground px-2 py-1 rounded-md capitalize">
                        {c.category?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">{c.name}</h3>
                    {c.description && <p className="text-sm text-foreground/80 font-body line-clamp-2 mb-3">{c.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.member_count} members</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c.story_count} stories</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Communities;

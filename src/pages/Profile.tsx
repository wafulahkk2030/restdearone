import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { User, MapPin, Edit, Save, BookOpen, Users, Heart } from "lucide-react";
import { getFlag } from "@/lib/countries";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", city: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ memorials: 0, stories: 0, communities: 0 });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const [pRes, mRes, sRes, cRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase.from("memorial_pages").select("id", { count: "exact", head: true }).eq("created_by", user!.id),
      supabase.from("stories").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
      supabase.from("community_members").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    ]);
    setProfile(pRes.data);
    setStats({ memorials: mRes.count || 0, stories: sRes.count || 0, communities: cRes.count || 0 });
    if (pRes.data) {
      setForm({ display_name: pRes.data.display_name || "", bio: pRes.data.bio || "", city: pRes.data.city || "" });
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name,
      bio: form.bio || null,
      city: form.city || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      setEditing(false);
      loadProfile();
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Your Profile — RestDearOne</title>
        <meta name="description" content="View and manage your RestDearOne profile, memorials, stories, and community memberships." />
        <link rel="canonical" href="https://restdearone.lovable.app/profile" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              {editing ? (
                <div className="space-y-4 text-left max-w-sm mx-auto">
                  <div>
                    <Label className="font-body text-sm">Display Name</Label>
                    <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="font-body text-sm">Bio</Label>
                    <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="mt-1" placeholder="Tell people about yourself..." />
                  </div>
                  <div>
                    <Label className="font-body text-sm">City</Label>
                    <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" placeholder="e.g. Nairobi" />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button variant="hero" onClick={saveProfile} disabled={saving} className="gap-1">
                      <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {profile?.country && <span className="mr-2">{getFlag(profile.country)}</span>}
                    {profile?.display_name || profile?.username}
                  </h1>
                  <p className="text-sm text-muted-foreground font-body">@{profile?.username}</p>
                  {profile?.city && (
                    <p className="text-sm text-muted-foreground font-body flex items-center justify-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {profile.city}
                    </p>
                  )}
                  {profile?.bio && <p className="text-sm text-foreground/80 font-body mt-3 max-w-md mx-auto">{profile.bio}</p>}
                  <p className="text-xs text-muted-foreground font-body mt-3">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1 mt-4">
                    <Edit className="w-4 h-4" /> Edit Profile
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl font-bold text-foreground">{stats.memorials}</p>
                <p className="text-xs text-muted-foreground font-body">Memorials</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Heart className="w-6 h-6 text-warm mx-auto mb-2" />
                <p className="font-display text-2xl font-bold text-foreground">{stats.stories}</p>
                <p className="text-xs text-muted-foreground font-body">Stories</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Users className="w-6 h-6 text-sage mx-auto mb-2" />
                <p className="font-display text-2xl font-bold text-foreground">{stats.communities}</p>
                <p className="text-xs text-muted-foreground font-body">Communities</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;

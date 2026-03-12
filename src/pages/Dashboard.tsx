import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BookOpen, Users, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [storiesCount, setStoriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [memRes, followRes, storiesRes] = await Promise.all([
      supabase.from("memorial_pages").select("*").eq("created_by", user!.id).order("created_at", { ascending: false }),
      supabase.from("memorial_followers").select("*, memorial_pages(*)").eq("user_id", user!.id),
      supabase.from("stories").select("id", { count: "exact" }).eq("author_id", user!.id),
    ]);
    setMemorials(memRes.data || []);
    setFollowing(followRes.data || []);
    setStoriesCount(storiesRes.count || 0);
    setLoading(false);
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Your Dashboard</h1>
            <p className="text-muted-foreground font-body mb-8">Welcome back. Here's your memory journey.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{memorials.length}</p>
              <p className="text-xs text-muted-foreground font-body">Pages Created</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Users className="w-6 h-6 text-sage mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{following.length}</p>
              <p className="text-xs text-muted-foreground font-body">Pages Following</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <PenLine className="w-6 h-6 text-warm mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{storiesCount}</p>
              <p className="text-xs text-muted-foreground font-body">Stories Written</p>
            </div>
          </div>

          {/* My Memorial Pages */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground">People You Remember</h2>
              <Link to="/create-memorial">
                <Button variant="hero" size="sm" className="gap-1"><Plus className="w-4 h-4" /> Create Page</Button>
              </Link>
            </div>
            {memorials.length === 0 ? (
              <div className="text-center py-8 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground font-body">You haven't created any memorial pages yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memorials.map(m => (
                  <Link key={m.id} to={`/memorial/${m.id}`}>
                    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-body px-2 py-0.5 rounded-full ${m.status === 'active' ? 'bg-sage/20 text-sage' : 'bg-muted text-muted-foreground'}`}>
                          {m.status}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{m.full_name}</h3>
                      <p className="text-xs text-muted-foreground font-body">{m.birth_year} – {m.death_year}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Following */}
          {following.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Pages You Follow</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {following.map((f: any) => (
                  <Link key={f.id} to={`/memorial/${f.memorial_id}`}>
                    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-display text-lg font-semibold text-foreground">{f.memorial_pages?.full_name}</h3>
                      <p className="text-xs text-muted-foreground font-body">{f.memorial_pages?.birth_year} – {f.memorial_pages?.death_year}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;

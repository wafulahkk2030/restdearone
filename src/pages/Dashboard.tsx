import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BookOpen, Users, PenLine, Plus, Bell, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [storiesCount, setStoriesCount] = useState(0);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [memRes, followRes, storiesRes, commRes, notifRes] = await Promise.all([
      supabase.from("memorial_pages").select("*").eq("created_by", user!.id).order("created_at", { ascending: false }),
      supabase.from("memorial_followers").select("*, memorial_pages(*)").eq("user_id", user!.id),
      supabase.from("stories").select("id", { count: "exact" }).eq("author_id", user!.id),
      supabase.from("community_members").select("*, community_groups(*)").eq("user_id", user!.id).eq("status", "active"),
      supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setMemorials(memRes.data || []);
    setFollowing(followRes.data || []);
    setStoriesCount(storiesRes.count || 0);
    setMyCommunities(commRes.data || []);
    setNotifications(notifRes.data || []);
    setLoading(false);
  };

  const markRead = async (notifId: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 flex items-center justify-center"><p className="text-muted-foreground font-body">Loading...</p></div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{memorials.length}</p>
              <p className="text-xs text-muted-foreground font-body">Pages Created</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Users className="w-6 h-6 text-sage mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{following.length}</p>
              <p className="text-xs text-muted-foreground font-body">Following</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <PenLine className="w-6 h-6 text-warm mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{storiesCount}</p>
              <p className="text-xs text-muted-foreground font-body">Stories</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{myCommunities.length}</p>
              <p className="text-xs text-muted-foreground font-body">My Groups</p>
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
                {unreadCount > 0 && <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-sm font-body cursor-pointer transition-colors ${
                      n.read ? "border-border bg-card text-muted-foreground" : "border-primary/30 bg-primary/5 text-foreground"
                    }`}
                    onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }}
                  >
                    <p>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                          {m.status === 'active' ? '🟢 Active' : '⚪ Not Activated'}
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

          {/* My Communities */}
          {myCommunities.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> My Communities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCommunities.map((cm: any) => (
                  <Link key={cm.id} to={`/community/${cm.community_id}`}>
                    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-display text-lg font-semibold text-foreground">{cm.community_groups?.name}</h3>
                      <p className="text-xs text-muted-foreground font-body">{cm.role} · Joined {new Date(cm.joined_at).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

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

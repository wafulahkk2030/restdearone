import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, Flag, Activity, CreditCard, Settings, MessageSquare, Bell, Send, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminCommunities from "@/components/admin/AdminCommunities";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminContacted from "@/components/admin/AdminContacted";
import AdminFundraisers from "@/components/admin/AdminFundraisers";

type Tab = "overview" | "reports" | "memorials" | "communities" | "users" | "payments" | "fundraisers" | "logs" | "notifications" | "contacted";

const Admin = () => {
  const { user, isAdmin, adminRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState({ memorials: 0, stories: 0, users: 0, reports: 0, payments: 0, communities: 0 });
  const [reports, setReports] = useState<any[]>([]);
  const [memorials, setMemorials] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification state
  const [notifUserId, setNotifUserId] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifLink, setNotifLink] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Incomplete communities
  const [inactiveCommunities, setInactiveCommunities] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (user && isAdmin) loadData();
  }, [user, isAdmin, tab]);

  const loadData = async () => {
    setLoading(true);
    const [memRes, storyRes, profileRes, reportRes, payRes, comRes] = await Promise.all([
      supabase.from("memorial_pages").select("id", { count: "exact", head: true }),
      supabase.from("stories").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("id", { count: "exact", head: true }),
      supabase.from("community_groups").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      memorials: memRes.count || 0,
      stories: storyRes.count || 0,
      users: profileRes.count || 0,
      reports: reportRes.count || 0,
      payments: payRes.count || 0,
      communities: comRes.count || 0,
    });

    if (tab === "reports") {
      const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50);
      setReports(data || []);
    }
    if (tab === "memorials") {
      const { data } = await supabase.from("memorial_pages").select("*").order("created_at", { ascending: false }).limit(50);
      setMemorials(data || []);
    }
    if (tab === "logs") {
      const { data } = await supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(50);
      setLogs(data || []);
    }
    if (tab === "notifications") {
      const { data } = await supabase.from("profiles").select("id, display_name, username, email").order("created_at", { ascending: false }).limit(500);
      setAllUsers(data || []);
    }
    if (tab === "communities") {
      const { data } = await supabase.from("community_groups").select("*, profiles:created_by(display_name, username, email)").eq("is_active", false).order("created_at", { ascending: false }).limit(50);
      setInactiveCommunities(data || []);
    }
    setLoading(false);
  };

  const updateReportStatus = async (reportId: string, status: "pending" | "under_review" | "resolved" | "dismissed") => {
    await supabase.from("reports").update({ status }).eq("id", reportId);
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.id,
      action: `report_${status}`,
      target_type: "report",
      target_id: reportId,
    });
    toast({ title: `Report ${status}` });
    loadData();
  };

  const deleteMemorial = async (memorialId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This removes all stories, followers, and payments. Cannot be undone.`)) return;
    await Promise.all([
      supabase.from("stories").delete().eq("memorial_id", memorialId),
      supabase.from("memorial_followers").delete().eq("memorial_id", memorialId),
      supabase.from("payments").delete().eq("memorial_id", memorialId),
      supabase.from("memory_keywords").delete().eq("memorial_id", memorialId),
      supabase.from("flower_tributes").delete().eq("memorial_id", memorialId),
    ]);
    await supabase.from("memorial_pages").delete().eq("id", memorialId);
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.id,
      action: "delete_memorial",
      target_type: "memorial_page",
      target_id: memorialId,
      details: { name },
    });
    toast({ title: "Memorial deleted" });
    loadData();
  };

  const adminActivateMemorial = async (memorialId: string) => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    await supabase.from("memorial_pages").update({
      status: "active" as any,
      activation_expiry: expiry.toISOString(),
    }).eq("id", memorialId);
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.id,
      action: "admin_activate_memorial",
      target_type: "memorial_page",
      target_id: memorialId,
    });
    toast({ title: "Memorial activated for 1 year" });
    loadData();
  };

  const sendNotification = async () => {
    if (!notifUserId || !notifMessage) {
      toast({ title: "User and message required", variant: "destructive" });
      return;
    }
    setSendingNotif(true);
    const { error } = await supabase.from("notifications").insert({
      user_id: notifUserId,
      message: notifMessage,
      link: notifLink || null,
    });
    setSendingNotif(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notification sent!" });
      setNotifMessage("");
      setNotifLink("");
      await supabase.from("admin_activity_logs").insert({
        admin_id: user!.id,
        action: "send_notification",
        target_type: "user",
        target_id: notifUserId,
        details: { message: notifMessage },
      });
    }
  };

  if (authLoading || !isAdmin) return null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "reports", label: "Reports", icon: Flag },
    { key: "memorials", label: "Memorials", icon: BookOpen },
    { key: "communities", label: "Communities", icon: MessageSquare },
    { key: "users", label: "Users", icon: Users },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "fundraisers", label: "Fundraisers", icon: Heart },
    { key: "notifications", label: "Send Notification", icon: Bell },
    { key: "contacted", label: "Contacted", icon: Mail },
    { key: "logs", label: "Activity Logs", icon: Settings },
  ];

  const filteredUsers = userSearch
    ? allUsers.filter(u =>
        (u.display_name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
      )
    : allUsers;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div className="flex items-center gap-3 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground font-body capitalize">Role: {adminRole?.replace(/_/g, ' ')}</p>
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all ${
                    tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "overview" && <AdminOverview stats={stats} />}
          {tab === "communities" && (
            <div className="space-y-6">
              <AdminCommunities userId={user!.id} adminRole={adminRole} />
              {/* Incomplete communities */}
              {inactiveCommunities.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">⚠️ Incomplete Communities (Not Paid)</h3>
                  <div className="space-y-3">
                    {inactiveCommunities.map(c => (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                        <div>
                          <h4 className="font-display text-base font-semibold text-foreground">{c.name}</h4>
                          <p className="text-xs text-muted-foreground font-body">
                            Created by: {c.profiles?.display_name || c.profiles?.username || c.profiles?.email || "Unknown"} · {new Date(c.created_at).toLocaleDateString()}
                          </p>
                          <span className="text-xs bg-warm/20 text-warm px-2 py-0.5 rounded-full font-body">Payment Incomplete</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/community/${c.id}`)}>View</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "users" && <AdminUsers userId={user!.id} adminRole={adminRole} />}
          {tab === "payments" && <AdminPayments />}
          {tab === "fundraisers" && <AdminFundraisers userId={user!.id} />}
          {tab === "contacted" && <AdminContacted />}

          {tab === "notifications" && (
            <div className="max-w-lg mx-auto space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Send In-App Notification</h3>
              <div>
                <label className="text-xs font-body text-muted-foreground">Search User</label>
                <Input placeholder="Search by name, username, or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mt-1" />
              </div>
              {userSearch && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                  {filteredUsers.slice(0, 20).map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setNotifUserId(u.id); setUserSearch(u.display_name || u.username || u.email || ""); }}
                      className={`w-full text-left px-3 py-2 text-sm font-body hover:bg-accent transition-colors ${notifUserId === u.id ? "bg-primary/10" : ""}`}
                    >
                      {u.display_name || u.username} <span className="text-muted-foreground">({u.email})</span>
                    </button>
                  ))}
                </div>
              )}
              {notifUserId && (
                <p className="text-xs text-muted-foreground font-body">Selected: {notifUserId.slice(0, 8)}...</p>
              )}
              <div>
                <label className="text-xs font-body text-muted-foreground">Message</label>
                <Textarea placeholder="Type your notification message..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground">Link (optional)</label>
                <Input placeholder="/memorial/... or /community/..." value={notifLink} onChange={e => setNotifLink(e.target.value)} className="mt-1" />
              </div>
              <Button variant="hero" onClick={sendNotification} disabled={sendingNotif} className="gap-1">
                <Send className="w-4 h-4" /> {sendingNotif ? "Sending..." : "Send Notification"}
              </Button>
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-8">No reports yet.</p>
              ) : reports.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-foreground">{r.reason}</p>
                    <p className="text-xs text-muted-foreground font-body">{r.content_type} · {new Date(r.created_at).toLocaleDateString()}</p>
                    <span className={`text-xs font-body px-2 py-0.5 rounded-full mt-1 inline-block ${
                      r.status === 'pending' ? 'bg-accent text-accent-foreground' : r.status === 'resolved' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{r.status}</span>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, 'resolved')}>Resolve</Button>
                      <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, 'dismissed')}>Dismiss</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "memorials" && (
            <div className="space-y-3">
              {memorials.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">{m.full_name}</h3>
                    <p className="text-xs text-muted-foreground font-body">
                      {m.birth_year} – {m.death_year} · Status: 
                      <span className={`ml-1 px-2 py-0.5 rounded-full ${m.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                        {m.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/memorial/${m.id}`)}>View</Button>
                    {m.status !== 'active' && (
                      <Button size="sm" variant="sage" onClick={() => adminActivateMemorial(m.id)}>Activate</Button>
                    )}
                    {(adminRole === 'super_admin' || adminRole === 'platform_admin') && (
                      <Button size="sm" variant="destructive" onClick={() => deleteMemorial(m.id, m.full_name)}>Delete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "logs" && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-8">No activity yet.</p>
              ) : logs.map(l => (
                <div key={l.id} className="bg-card border border-border rounded-xl p-4 text-sm font-body">
                  <span className="text-foreground font-medium">{l.action?.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground"> · {l.target_type?.replace(/_/g, ' ')} · {new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;

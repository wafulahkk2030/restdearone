import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, Flag, Activity, CreditCard, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminCommunities from "@/components/admin/AdminCommunities";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayments from "@/components/admin/AdminPayments";

type Tab = "overview" | "reports" | "memorials" | "communities" | "users" | "payments" | "logs";

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
    // Clean up related data
    await Promise.all([
      supabase.from("stories").delete().eq("memorial_id", memorialId),
      supabase.from("memorial_followers").delete().eq("memorial_id", memorialId),
      supabase.from("payments").delete().eq("memorial_id", memorialId),
      supabase.from("memory_keywords").delete().eq("memorial_id", memorialId),
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

  if (authLoading || !isAdmin) return null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "reports", label: "Reports", icon: Flag },
    { key: "memorials", label: "Memorials", icon: BookOpen },
    { key: "communities", label: "Communities", icon: MessageSquare },
    { key: "users", label: "Users", icon: Users },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "logs", label: "Activity Logs", icon: Settings },
  ];

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

          {tab === "communities" && <AdminCommunities userId={user!.id} adminRole={adminRole} />}

          {tab === "users" && <AdminUsers userId={user!.id} adminRole={adminRole} />}

          {tab === "payments" && <AdminPayments />}

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

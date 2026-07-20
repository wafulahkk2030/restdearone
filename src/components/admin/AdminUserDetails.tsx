import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Ban, Trash2, LogOut, KeyRound, CheckCircle2, XCircle, Mail, Clock } from "lucide-react";

type AuthUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  banned_until: string | null;
  is_anonymous: boolean;
  provider: string | null;
  profile: any;
  role: string | null;
  suspension: any;
  warnings: number;
};

const fmt = (v?: string | null) => v ? new Date(v).toLocaleString() : "—";
const relative = (v?: string | null) => {
  if (!v) return "never";
  const diff = Date.now() - new Date(v).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const d = Math.floor(hrs / 24);
  return `${d}d ago`;
};

const AdminUserDetails = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-user-details", {
      method: "GET" as any,
      // pass page via query — invoke doesn't support query params directly; use body fallback
    } as any);
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setUsers(data?.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const runAction = async (action: string, target_user_id: string, label: string, extra?: any) => {
    const { data, error } = await supabase.functions.invoke("admin-user-action", {
      body: { action, target_user_id, ...extra },
    });
    if (error || (data as any)?.error) {
      toast({ title: `${label} failed`, description: error?.message || (data as any)?.error, variant: "destructive" });
    } else {
      toast({ title: `${label} done` });
      load();
    }
  };

  const filtered = search
    ? users.filter(u =>
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.profile?.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.profile?.display_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search email / username / name..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body text-center py-8">Loading auth users...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
            const isOpen = expanded === u.id;
            return (
              <div key={u.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : u.id)} className="w-full p-4 text-left hover:bg-accent/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display font-semibold text-foreground text-sm truncate">
                          {u.profile?.display_name || u.profile?.username || u.email || u.id.slice(0, 8)}
                        </p>
                        {u.role && (
                          <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {u.role.replace(/_/g, " ")}
                          </span>
                        )}
                        {isBanned && <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">banned</span>}
                        {u.suspension && <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-warm/20 text-warm">suspended</span>}
                        {u.warnings > 0 && <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{u.warnings} warning(s)</span>}
                        {!u.email_confirmed_at && !u.is_anonymous && <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-muted text-muted-foreground">unconfirmed</span>}
                      </div>
                      <p className="text-xs text-muted-foreground font-body mt-1 truncate">
                        <Mail className="w-3 h-3 inline mr-1" />{u.email || "no email"} · <Clock className="w-3 h-3 inline mr-1" />last seen {relative(u.last_sign_in_at)}
                      </p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 space-y-3 bg-muted/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-body">
                      <div><span className="text-muted-foreground">User ID:</span><br /><span className="text-foreground break-all">{u.id}</span></div>
                      <div><span className="text-muted-foreground">Provider:</span><br /><span className="text-foreground">{u.provider || "email"}</span></div>
                      <div><span className="text-muted-foreground">Username:</span><br /><span className="text-foreground">@{u.profile?.username || "—"}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span><br /><span className="text-foreground">{u.phone || "—"}</span></div>
                      <div><span className="text-muted-foreground">Country:</span><br /><span className="text-foreground">{u.profile?.country || "—"} {u.profile?.city ? `· ${u.profile.city}` : ""}</span></div>
                      <div><span className="text-muted-foreground">Signed up:</span><br /><span className="text-foreground">{fmt(u.created_at)}</span></div>
                      <div><span className="text-muted-foreground">Last sign in:</span><br /><span className="text-foreground">{fmt(u.last_sign_in_at)}</span></div>
                      <div>
                        <span className="text-muted-foreground">Email confirmed:</span><br />
                        {u.email_confirmed_at
                          ? <span className="text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {fmt(u.email_confirmed_at)}</span>
                          : <span className="text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3" /> no</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Banned until:</span><br />
                        <span className="text-foreground">{isBanned ? fmt(u.banned_until) : "—"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => runAction("reset_password_email", u.id, "Password reset email")} className="gap-1">
                        <KeyRound className="w-3 h-3" /> Reset password
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => runAction("force_signout", u.id, "Force sign-out")} className="gap-1">
                        <LogOut className="w-3 h-3" /> Force sign-out
                      </Button>
                      {isBanned ? (
                        <Button size="sm" variant="outline" onClick={() => runAction("unban", u.id, "Unban")} className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Unban
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => {
                          const h = prompt("Ban duration in hours (blank = permanent):");
                          if (h === null) return;
                          runAction("ban", u.id, "Ban", { duration_hours: h ? parseInt(h) : undefined });
                        }} className="gap-1">
                          <Ban className="w-3 h-3" /> Ban
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (!confirm(`PERMANENTLY delete ${u.email}? This cannot be undone.`)) return;
                        runAction("delete", u.id, "Delete user");
                      }} className="gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
        <span className="text-xs text-muted-foreground font-body">Page {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
};

export default AdminUserDetails;
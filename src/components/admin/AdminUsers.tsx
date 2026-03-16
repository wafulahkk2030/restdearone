import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Ban, AlertTriangle } from "lucide-react";

const AdminUsers = ({ userId, adminRole }: { userId: string; adminRole: string | null }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [suspensions, setSuspensions] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    if (search) query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await query;
    setUsers(data || []);

    // Load roles
    const { data: rolesData } = await supabase.from("user_roles").select("*");
    const roleMap: Record<string, string> = {};
    (rolesData || []).forEach(r => { roleMap[r.user_id] = r.role; });
    setRoles(roleMap);

    // Load active suspensions
    const { data: susData } = await supabase.from("user_suspensions").select("*");
    const susMap: Record<string, any> = {};
    (susData || []).forEach(s => { susMap[s.user_id] = s; });
    setSuspensions(susMap);

    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const suspendUser = async (targetId: string, username: string) => {
    const reason = prompt(`Reason for suspending "${username}":`);
    if (!reason) return;
    await supabase.from("user_suspensions").insert({
      user_id: targetId,
      suspended_by: userId,
      reason,
      suspension_type: "temporary",
      suspension_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId,
      action: "suspend_user",
      target_type: "user",
      target_id: targetId,
      details: { username, reason },
    });
    toast({ title: `${username} suspended` });
    load();
  };

  const warnUser = async (targetId: string, username: string) => {
    const reason = prompt(`Warning message for "${username}":`);
    if (!reason) return;
    await supabase.from("user_warnings").insert({
      user_id: targetId,
      issued_by_admin: userId,
      warning_reason: reason,
    });
    await supabase.from("notifications").insert({
      user_id: targetId,
      message: `⚠️ You have received a warning: ${reason}`,
    });
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId,
      action: "warn_user",
      target_type: "user",
      target_id: targetId,
      details: { username, reason },
    });
    toast({ title: `Warning sent to ${username}` });
  };

  const unsuspendUser = async (targetId: string, username: string) => {
    await supabase.from("user_suspensions").delete().eq("user_id", targetId);
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId,
      action: "unsuspend_user",
      target_type: "user",
      target_id: targetId,
    });
    toast({ title: `${username} unsuspended` });
    load();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by username, name, or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-md"
      />
      {loading ? (
        <p className="text-muted-foreground font-body text-center py-8">Loading...</p>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-base font-semibold text-foreground">{u.display_name || u.username}</h3>
                  {roles[u.id] && (
                    <span className="text-xs font-body px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {roles[u.id]?.replace(/_/g, ' ')}
                    </span>
                  )}
                  {suspensions[u.id] && (
                    <span className="text-xs font-body px-2 py-0.5 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Suspended
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-body">@{u.username} · {u.email || 'No email'}</p>
                <p className="text-xs text-muted-foreground font-body">{u.country || 'Unknown'} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
              {(adminRole === 'super_admin' || adminRole === 'platform_admin') && !roles[u.id] && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => warnUser(u.id, u.username)}>
                    <AlertTriangle className="w-3 h-3 mr-1" /> Warn
                  </Button>
                  {suspensions[u.id] ? (
                    <Button size="sm" variant="outline" onClick={() => unsuspendUser(u.id, u.username)}>Unsuspend</Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => suspendUser(u.id, u.username)}>
                      <Ban className="w-3 h-3 mr-1" /> Suspend
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, ShieldPlus } from "lucide-react";

const ROLES = ["super_admin", "platform_admin", "community_moderator", "memorial_moderator", "support_admin"] as const;

const AdminRoles = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("support_admin");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: false });
    const ids = (data || []).map((r) => r.user_id);
    let profiles: any[] = [];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, username, display_name, email").in("id", ids);
      profiles = p || [];
    }
    const map = new Map(profiles.map((p) => [p.id, p]));
    setRows((data || []).map((r) => ({ ...r, profile: map.get(r.user_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grant = async () => {
    if (!email.trim()) return toast({ title: "Enter an email or username", variant: "destructive" });
    setBusy(true);
    const term = email.trim();
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, email, username")
      .or(`email.eq.${term},username.eq.${term}`)
      .maybeSingle();
    if (!prof) {
      setBusy(false);
      return toast({ title: "User not found", description: "No profile matches that email or username.", variant: "destructive" });
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: prof.id, role: role as any });
    setBusy(false);
    if (error) return toast({ title: "Could not grant role", description: error.message, variant: "destructive" });
    toast({ title: "Role granted" });
    setEmail("");
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast({ title: "Could not revoke", description: error.message, variant: "destructive" });
    toast({ title: "Role revoked" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-body font-medium text-foreground">Grant an admin role</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="User email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-body"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Button onClick={grant} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldPlus className="w-4 h-4 mr-1" />} Grant
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 text-muted-foreground">User</th>
              <th className="text-left px-4 py-2 text-muted-foreground">Email</th>
              <th className="text-left px-4 py-2 text-muted-foreground">Role</th>
              <th className="text-left px-4 py-2 text-muted-foreground">Granted</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No admin roles assigned.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-2 text-foreground">{r.profile?.display_name || r.profile?.username || r.user_id}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.profile?.email || "—"}</td>
                <td className="px-4 py-2 capitalize text-foreground">{r.role.replace(/_/g, " ")}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="destructive" onClick={() => revoke(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRoles;
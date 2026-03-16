import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Crown } from "lucide-react";

const AdminCommunities = ({ userId, adminRole }: { userId: string; adminRole: string | null }) => {
  const { toast } = useToast();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("community_groups").select("*").order("created_at", { ascending: false });
    setCommunities(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteCommunity = async (id: string, name: string) => {
    if (!confirm(`Delete community "${name}"? This removes all members and stories. Cannot be undone.`)) return;
    // Delete members and stories first
    await supabase.from("community_members").delete().eq("community_id", id);
    await supabase.from("community_stories").delete().eq("community_id", id);
    await supabase.from("community_payments").delete().eq("community_id", id);
    await supabase.from("community_groups").delete().eq("id", id);
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId,
      action: "delete_community",
      target_type: "community_group",
      target_id: id,
      details: { name },
    });
    toast({ title: `Community "${name}" deleted` });
    load();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from("community_groups").update({ is_active: !currentStatus }).eq("id", id);
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId,
      action: currentStatus ? "deactivate_community" : "activate_community",
      target_type: "community_group",
      target_id: id,
    });
    toast({ title: currentStatus ? "Community deactivated" : "Community activated" });
    load();
  };

  if (loading) return <p className="text-muted-foreground font-body text-center py-8">Loading...</p>;

  return (
    <div className="space-y-3">
      {communities.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-8">No communities yet.</p>
      ) : communities.map(c => (
        <div key={c.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-primary" />
              <h3 className="font-display text-base font-semibold text-foreground">{c.name}</h3>
              <span className={`text-xs font-body px-2 py-0.5 rounded-full ${c.is_active ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-body capitalize">{c.category?.replace(/_/g, ' ')} · {c.billing_cycle}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-body mt-1">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.member_count} members</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c.story_count} stories</span>
              <span>KES {c.price_kes} / ${c.price_usd}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => toggleActive(c.id, c.is_active)}>
              {c.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            {(adminRole === 'super_admin' || adminRole === 'platform_admin') && (
              <Button size="sm" variant="destructive" onClick={() => deleteCommunity(c.id, c.name)}>Delete</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminCommunities;

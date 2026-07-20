import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search } from "lucide-react";

const AdminStoriesMod = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("stories").select("*, profiles:author_id(username, display_name)").order("created_at", { ascending: false }).limit(100);
    if (search) q = q.ilike("content", `%${search}%`);
    const { data } = await q;
    setStories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const remove = async (id: string) => {
    if (!confirm("Delete this story? Author will be notified.")) return;
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.id, action: "delete_story", target_type: "story", target_id: id,
    });
    toast({ title: "Story removed" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search story content..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body text-center py-8">Loading stories...</p>
      ) : (
        <div className="space-y-3">
          {stories.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-body">
                  by @{(s.profiles as any)?.username || "unknown"} · {new Date(s.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-foreground font-body mt-1 line-clamp-3">{s.content}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => remove(s.id)} className="gap-1 flex-shrink-0">
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          ))}
          {stories.length === 0 && <p className="text-muted-foreground font-body text-center py-8">No stories match.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminStoriesMod;
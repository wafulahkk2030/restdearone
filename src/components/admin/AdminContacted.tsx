import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, MailOpen, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminContacted = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from("contact_submissions" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setSubmissions((data as any[]) || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("contact_submissions" as any).update({ is_read: true } as any).eq("id", id);
    load();
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    await supabase.from("contact_submissions" as any).delete().eq("id", id);
    if (selected?.id === id) setSelected(null);
    toast({ title: "Deleted" });
    load();
  };

  const unreadCount = submissions.filter(s => !s.is_read).length;

  if (loading) return <p className="text-muted-foreground font-body text-center py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Contact Submissions {unreadCount > 0 && <span className="text-primary">({unreadCount} unread)</span>}
        </h3>
      </div>

      {selected ? (
        <motion.div className="bg-card border border-border rounded-xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>← Back</Button>
            <div className="flex gap-2">
              {!selected.is_read && <Button variant="sage" size="sm" onClick={() => markRead(selected.id)}>Mark Read</Button>}
              <Button variant="destructive" size="sm" onClick={() => deleteSubmission(selected.id)}>Delete</Button>
            </div>
          </div>
          <h4 className="font-display text-xl font-semibold text-foreground">{selected.subject}</h4>
          <p className="text-sm text-muted-foreground font-body mt-1">From: {selected.name} ({selected.email})</p>
          <p className="text-xs text-muted-foreground font-body">{new Date(selected.created_at).toLocaleString()}</p>
          <div className="mt-4 bg-background rounded-lg p-4">
            <p className="font-body text-foreground whitespace-pre-wrap">{selected.message}</p>
          </div>
          <div className="mt-4">
            <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`} className="text-primary font-body text-sm hover:underline">
              Reply via email →
            </a>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {submissions.length === 0 ? (
            <p className="text-muted-foreground font-body text-center py-8">No contact submissions yet.</p>
          ) : submissions.map(s => (
            <div key={s.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors ${s.is_read ? 'border-border' : 'border-primary/30 bg-primary/5'}`} onClick={() => { setSelected(s); if (!s.is_read) markRead(s.id); }}>
              <div className="flex items-center gap-3 min-w-0">
                {s.is_read ? <MailOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <Mail className="w-4 h-4 text-primary flex-shrink-0" />}
                <div className="min-w-0">
                  <p className={`font-body text-sm truncate ${s.is_read ? 'text-foreground' : 'text-foreground font-semibold'}`}>{s.subject}</p>
                  <p className="text-xs text-muted-foreground font-body truncate">{s.name} · {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); deleteSubmission(s.id); }} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContacted;

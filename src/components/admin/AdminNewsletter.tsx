import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";

const AdminNewsletter = () => {
  const [subs, setSubs] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
    setSubs(data || []);
  };
  useEffect(() => { load(); }, []);

  const exportCsv = () => {
    const header = "Email,Name,Source,Active,Subscribed At\n";
    const rows = subs.map((s) => [
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.name || "").replace(/"/g, '""')}"`,
      `"${(s.source || "").replace(/"/g, '""')}"`,
      s.is_active ? "yes" : "no",
      new Date(s.subscribed_at).toISOString(),
    ].join(","));
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /><h2 className="font-display text-xl font-semibold">Newsletter Subscribers <span className="text-sm text-muted-foreground">({subs.length})</span></h2></div>
        <Button variant="hero" onClick={exportCsv} disabled={subs.length === 0} className="gap-1"><Download className="w-4 h-4" /> Export CSV</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30"><tr className="text-left font-body text-xs text-muted-foreground"><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Source</th><th className="p-3">Date</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-border font-body">
                <td className="p-3 text-foreground">{s.email}</td>
                <td className="p-3 text-muted-foreground">{s.name || "—"}</td>
                <td className="p-3 text-muted-foreground">{s.source}</td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(s.subscribed_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground font-body">No subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminNewsletter;
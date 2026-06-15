import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Check, X, DollarSign } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  awaiting_payment: "Awaiting payment",
  paid: "Paid — awaiting approval",
  approved: "Published",
  rejected: "Rejected",
};

const AdminLegendArticles = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("legend_articles")
      .select("*, national_legends(full_name, slug)")
      .order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const setPrice = async (id: string) => {
    const amt = parseInt(prices[id] || "");
    if (!amt || amt < 1) { toast({ title: "Enter a valid price (KES)", variant: "destructive" }); return; }
    const { error } = await supabase.from("legend_articles").update({
      price_amount: amt,
      status: "awaiting_payment",
      admin_notes: notes[id] || null,
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Price sent to author" });
    load();
  };

  const approve = async (id: string) => {
    const { error } = await supabase.from("legend_articles").update({
      status: "approved",
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Article published" });
    load();
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Reason (optional):") || null;
    const { error } = await supabase.from("legend_articles").update({
      status: "rejected",
      rejection_reason: reason,
    }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Article rejected" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /><h2 className="font-display text-xl font-semibold">Legend Articles</h2></div>
      {items.length === 0 && <p className="text-muted-foreground font-body text-sm">No submissions yet.</p>}
      {items.map((a) => (
        <div key={a.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">{a.title}</h3>
              <p className="text-xs text-muted-foreground font-body">
                For <span className="text-primary">{a.national_legends?.full_name}</span> · by {a.author_name} ({a.author_email}) · {new Date(a.created_at).toLocaleDateString()}
              </p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-warm/20 text-warm font-body">{STATUS_LABELS[a.status] || a.status}</span>
              {a.price_amount > 0 && <span className="ml-2 text-xs text-primary font-body">KES {a.price_amount.toLocaleString()}</span>}
            </div>
          </div>
          {a.image_url && <img src={a.image_url} alt="" className="max-h-48 rounded-lg" />}
          <p className="text-sm text-foreground/90 font-body whitespace-pre-line">{a.body}</p>
          {a.source_url && <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-body">Source: {a.source_url}</a>}

          {a.status === "pending_review" && (
            <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 pt-2 border-t border-border">
              <Input type="number" placeholder="Price (KES)" value={prices[a.id] || ""} onChange={(e) => setPrices({ ...prices, [a.id]: e.target.value })} />
              <Input placeholder="Notes to author (optional)" value={notes[a.id] || ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
              <Button variant="hero" onClick={() => setPrice(a.id)} className="gap-1"><DollarSign className="w-4 h-4" />Set price</Button>
            </div>
          )}
          {a.status === "paid" && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="sage" size="sm" onClick={() => approve(a.id)} className="gap-1"><Check className="w-3 h-3" />Publish</Button>
              <Button variant="destructive" size="sm" onClick={() => reject(a.id)} className="gap-1"><X className="w-3 h-3" />Reject</Button>
            </div>
          )}
          {(a.status === "approved" || a.status === "awaiting_payment") && (
            <div className="flex gap-2 pt-2 border-t border-border">
              {a.status !== "approved" && <Button variant="sage" size="sm" onClick={() => approve(a.id)} className="gap-1"><Check className="w-3 h-3" />Force publish</Button>}
              <Button variant="destructive" size="sm" onClick={() => reject(a.id)} className="gap-1"><X className="w-3 h-3" />Reject</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminLegendArticles;
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Flag, Check, X, Edit3, Save } from "lucide-react";

const AdminNationalLegends = () => {
  const { toast } = useToast();
  const [legends, setLegends] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const { data } = await supabase.from("national_legends").select("*").order("created_at", { ascending: false });
    setLegends(data || []);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (l: any) => {
    setEditing(l.id);
    setForm({ ...l, quotes: (l.quotes || []).join("\n"), partner_organizations: (l.partner_organizations || []).join("\n"), gallery_images: (l.gallery_images || []).join("\n") });
  };

  const save = async () => {
    const payload: any = {
      ...form,
      quotes: form.quotes ? form.quotes.split("\n").filter(Boolean) : [],
      partner_organizations: form.partner_organizations ? form.partner_organizations.split("\n").filter(Boolean) : [],
      gallery_images: form.gallery_images ? form.gallery_images.split("\n").filter(Boolean) : [],
      tribute_target_amount: parseInt(form.tribute_target_amount) || 0,
      fundraising_target_amount: parseInt(form.fundraising_target_amount) || 0,
      flower_min_amount: parseInt(form.flower_min_amount) || 100,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      death_year: parseInt(form.death_year),
    };
    delete payload.created_at; delete payload.updated_at;
    const { error } = await supabase.from("national_legends").update(payload).eq("id", editing);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Legend updated" });
    setEditing(null); load();
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    await supabase.from("national_legends").update(patch).eq("id", id);
    toast({ title: `Marked ${status}` });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Flag className="w-5 h-5 text-primary" /><h2 className="font-display text-xl font-semibold">National Legends</h2></div>
      {legends.length === 0 && <p className="text-muted-foreground font-body text-sm">No submissions yet.</p>}
      {legends.map((l) => (
        <div key={l.id} className="bg-card border border-border rounded-xl p-5">
          {editing === l.id ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Input placeholder="Full name" value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                <Input placeholder="Title/Role" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Birth year" type="number" value={form.birth_year || ""} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} />
                <Input placeholder="Death year" type="number" value={form.death_year || ""} onChange={(e) => setForm({ ...form, death_year: e.target.value })} />
                <Input placeholder="Date of death" type="date" value={form.date_of_death || ""} onChange={(e) => setForm({ ...form, date_of_death: e.target.value })} />
                <Input placeholder="Location" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                <Input placeholder="Cause of death" value={form.cause_of_death || ""} onChange={(e) => setForm({ ...form, cause_of_death: e.target.value })} />
                <Input placeholder="URL slug (e.g. wangari-maathai)" value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <Input placeholder="Banner image URL" value={form.banner_image_url || ""} onChange={(e) => setForm({ ...form, banner_image_url: e.target.value })} />
                <Input placeholder="Video embed URL (Google Drive)" value={form.video_embed_url || ""} onChange={(e) => setForm({ ...form, video_embed_url: e.target.value })} />
              </div>
              <Textarea placeholder="National impact summary" rows={3} value={form.national_impact_summary || ""} onChange={(e) => setForm({ ...form, national_impact_summary: e.target.value })} />
              <Textarea placeholder="Biography" rows={5} value={form.biography || ""} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
              <Textarea placeholder="Quotes (one per line)" rows={3} value={form.quotes || ""} onChange={(e) => setForm({ ...form, quotes: e.target.value })} />
              <Textarea placeholder="Partner organizations (one per line)" rows={2} value={form.partner_organizations || ""} onChange={(e) => setForm({ ...form, partner_organizations: e.target.value })} />
              <Textarea placeholder="Gallery image URLs (one per line)" rows={3} value={form.gallery_images || ""} onChange={(e) => setForm({ ...form, gallery_images: e.target.value })} />
              <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                <div><label className="text-xs text-muted-foreground font-body">Tribute target (KES)</label><Input type="number" value={form.tribute_target_amount || ""} onChange={(e) => setForm({ ...form, tribute_target_amount: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground font-body">Fundraising target (KES)</label><Input type="number" value={form.fundraising_target_amount || ""} onChange={(e) => setForm({ ...form, fundraising_target_amount: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground font-body">Flower min amount (KES)</label><Input type="number" value={form.flower_min_amount || ""} onChange={(e) => setForm({ ...form, flower_min_amount: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground font-body">Flower price tier</label><Input value={form.flower_price_tier || ""} onChange={(e) => setForm({ ...form, flower_price_tier: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground font-body">Visibility</label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.visibility || "public"} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                    <option value="public">Public</option><option value="members">Members only</option><option value="hidden">Hidden</option>
                  </select>
                </div>
                <div className="flex items-end gap-2"><label className="flex items-center gap-2 text-sm font-body"><input type="checkbox" checked={!!form.is_official} onChange={(e) => setForm({ ...form, is_official: e.target.checked })} />Official badge</label></div>
              </div>
              <Textarea placeholder="Admin notes (internal)" rows={2} value={form.admin_notes || ""} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} />
              <div className="flex gap-2"><Button variant="hero" onClick={save} className="gap-1"><Save className="w-4 h-4" /> Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold">{l.full_name} <span className="text-xs text-muted-foreground">({l.death_year})</span></h3>
                <p className="text-xs text-muted-foreground font-body">{l.title} · {l.location}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-body ${l.status === 'approved' ? 'bg-primary/20 text-primary' : l.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-warm/20 text-warm'}`}>{l.status}</span>
                {l.is_official && <span className="ml-2 text-xs text-primary font-body">★ Official</span>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(l)} className="gap-1"><Edit3 className="w-3 h-3" />Edit</Button>
                {l.status !== "approved" && <Button size="sm" variant="sage" onClick={() => updateStatus(l.id, "approved")} className="gap-1"><Check className="w-3 h-3" />Approve</Button>}
                {l.status !== "rejected" && <Button size="sm" variant="destructive" onClick={() => updateStatus(l.id, "rejected")} className="gap-1"><X className="w-3 h-3" />Reject</Button>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminNationalLegends;
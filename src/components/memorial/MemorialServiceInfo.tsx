import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { MapPin, Clock, Heart, Edit, Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Props {
  memorialId: string;
  memorialName: string;
  birthYear: number;
  deathYear: number;
  isOwner: boolean;
}

const MemorialServiceInfo = ({ memorialId, memorialName, birthYear, deathYear, isOwner }: Props) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    service_date: "", service_time: "", venue_name: "", venue_address: "", donation_info: "", additional_notes: "",
  });

  const canEdit = isOwner || isAdmin;

  useEffect(() => { loadInfo(); }, [memorialId]);

  const loadInfo = async () => {
    const { data } = await supabase
      .from("memorial_service_info" as any)
      .select("*")
      .eq("memorial_id", memorialId)
      .maybeSingle();
    setInfo(data);
    if (data) {
      setForm({
        service_date: (data as any).service_date || "",
        service_time: (data as any).service_time || "",
        venue_name: (data as any).venue_name || "",
        venue_address: (data as any).venue_address || "",
        donation_info: (data as any).donation_info || "",
        additional_notes: (data as any).additional_notes || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const payload = {
      memorial_id: memorialId,
      service_date: form.service_date || null,
      service_time: form.service_time || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      donation_info: form.donation_info || null,
      additional_notes: form.additional_notes || null,
    };

    if (info) {
      await supabase.from("memorial_service_info" as any).update(payload as any).eq("id", (info as any).id);
    } else {
      await supabase.from("memorial_service_info" as any).insert(payload as any);
    }
    toast({ title: "Service info saved" });
    setEditing(false);
    loadInfo();
  };

  if (loading) return null;
  if (!info && !canEdit) return null;

  if (!info && canEdit) {
    return (
      <div className="mb-10 text-center">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Add Memorial Service Details
        </Button>
        {editing && (
          <motion.div className="mt-4 bg-card border border-border rounded-xl p-6 text-left max-w-lg mx-auto space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 className="font-display text-base font-semibold text-foreground">Memorial Service Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-body text-muted-foreground">Date</label><Input type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} /></div>
              <div><label className="text-xs font-body text-muted-foreground">Time</label><Input placeholder="2:00 PM" value={form.service_time} onChange={e => setForm(f => ({ ...f, service_time: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs font-body text-muted-foreground">Venue Name</label><Input placeholder="Grace Community Church" value={form.venue_name} onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} /></div>
            <div><label className="text-xs font-body text-muted-foreground">Venue Address</label><Input placeholder="145 Oak Street, Burlington" value={form.venue_address} onChange={e => setForm(f => ({ ...f, venue_address: e.target.value }))} /></div>
            <div><label className="text-xs font-body text-muted-foreground">In lieu of flowers / Donations</label><Textarea placeholder="Donations may be made to..." value={form.donation_info} onChange={e => setForm(f => ({ ...f, donation_info: e.target.value }))} /></div>
            <div><label className="text-xs font-body text-muted-foreground">Additional Notes</label><Textarea placeholder="Any other details..." value={form.additional_notes} onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
              <Button variant="hero" size="sm" onClick={handleSave} className="gap-1"><Save className="w-4 h-4" /> Save</Button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  const serviceDate = info?.service_date ? new Date(info.service_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <motion.div
      className="mb-10 bg-card border border-border rounded-xl p-8 text-center relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <h3 className="font-display text-xl font-bold text-foreground mb-6">Memorial Service</h3>
        
        {serviceDate && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="font-body text-foreground">
              {serviceDate}{info?.service_time ? ` at ${info.service_time}` : ""}
            </p>
          </div>
        )}

        {info?.venue_name && (
          <div className="mb-1">
            <p className="font-display text-base font-semibold text-foreground">{info.venue_name}</p>
          </div>
        )}
        {info?.venue_address && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">{info.venue_address}</p>
          </div>
        )}

        {info?.donation_info && (
          <div className="border-t border-border pt-4 mt-4">
            <p className="font-body text-sm text-muted-foreground italic">{info.donation_info}</p>
          </div>
        )}

        {info?.additional_notes && (
          <p className="font-body text-xs text-muted-foreground mt-3">{info.additional_notes}</p>
        )}

        <div className="border-t border-border pt-4 mt-4 flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          <p className="font-display text-sm text-muted-foreground">
            Forever in our hearts • {birthYear} – {deathYear}
          </p>
        </div>

        {canEdit && (
          <div className="mt-4">
            {editing ? (
              <div className="text-left space-y-3 max-w-lg mx-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-body text-muted-foreground">Date</label><Input type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} /></div>
                  <div><label className="text-xs font-body text-muted-foreground">Time</label><Input value={form.service_time} onChange={e => setForm(f => ({ ...f, service_time: e.target.value }))} /></div>
                </div>
                <div><label className="text-xs font-body text-muted-foreground">Venue</label><Input value={form.venue_name} onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} /></div>
                <div><label className="text-xs font-body text-muted-foreground">Address</label><Input value={form.venue_address} onChange={e => setForm(f => ({ ...f, venue_address: e.target.value }))} /></div>
                <div><label className="text-xs font-body text-muted-foreground">Donations</label><Textarea value={form.donation_info} onChange={e => setForm(f => ({ ...f, donation_info: e.target.value }))} /></div>
                <div><label className="text-xs font-body text-muted-foreground">Notes</label><Textarea value={form.additional_notes} onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))} /></div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="hero" size="sm" onClick={handleSave} className="gap-1"><Save className="w-4 h-4" /> Save</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1"><Edit className="w-4 h-4" /> Edit Service Info</Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MemorialServiceInfo;

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useInView } from "framer-motion";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface JourneyEvent {
  id: string;
  year: number;
  title: string;
  description: string | null;
  sort_order: number;
}

interface Props {
  memorialId: string;
  memorialName: string;
  birthYear: number;
  deathYear: number;
  isOwner: boolean;
}

const TimelineItem = ({ event, index, isOwner, onDelete, onEdit }: {
  event: JourneyEvent;
  index: number;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onEdit: (event: JourneyEvent) => void;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const isLeft = index % 2 === 0;

  return (
    <div ref={ref} className="relative flex items-start md:items-center gap-4 md:gap-0">
      {/* Desktop: alternating layout */}
      <div className={`hidden md:flex w-full items-center ${isLeft ? '' : 'flex-row-reverse'}`}>
        {/* Content side */}
        <motion.div
          className="w-5/12"
          initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className={`bg-card border border-border rounded-xl p-6 ${isLeft ? 'text-right' : 'text-left'}`}>
            <span className="text-primary font-display text-sm font-semibold tracking-[0.2em]">{event.year}</span>
            <h3 className="font-display text-xl font-bold text-foreground mt-1">{event.title}</h3>
            {event.description && (
              <p className="text-muted-foreground font-body text-sm mt-2 leading-relaxed">{event.description}</p>
            )}
            {isOwner && (
              <div className={`flex gap-1 mt-3 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                <button onClick={() => onEdit(event)} className="text-xs text-muted-foreground hover:text-primary"><Edit className="w-3 h-3" /></button>
                <button onClick={() => onDelete(event.id)} className="text-xs text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Center line + dot */}
        <div className="w-2/12 flex justify-center relative">
          <motion.div
            className="w-4 h-4 bg-primary rounded-full border-4 border-background z-10 shadow-lg"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          />
        </div>

        {/* Empty side */}
        <div className="w-5/12" />
      </div>

      {/* Mobile: single column */}
      <div className="flex md:hidden items-start gap-4 w-full">
        <div className="flex flex-col items-center">
          <motion.div
            className="w-3 h-3 bg-primary rounded-full border-2 border-background z-10 shadow-md flex-shrink-0"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.3 }}
          />
          <div className="w-px bg-border flex-1 min-h-[20px]" />
        </div>
        <motion.div
          className="flex-1 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="text-primary font-display text-xs font-semibold tracking-[0.2em]">{event.year}</span>
          <h3 className="font-display text-lg font-bold text-foreground">{event.title}</h3>
          {event.description && (
            <p className="text-muted-foreground font-body text-sm mt-1 leading-relaxed">{event.description}</p>
          )}
          {isOwner && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => onEdit(event)} className="text-xs text-muted-foreground hover:text-primary"><Edit className="w-3 h-3" /></button>
              <button onClick={() => onDelete(event.id)} className="text-xs text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const JourneyTimeline = ({ memorialId, memorialName, birthYear, deathYear, isOwner }: Props) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ year: birthYear, title: "", description: "" });

  const canEdit = isOwner || isAdmin;

  useEffect(() => { loadEvents(); }, [memorialId]);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("memorial_journey_events" as any)
      .select("*")
      .eq("memorial_id", memorialId)
      .order("sort_order", { ascending: true })
      .order("year", { ascending: true });
    setEvents((data as any[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.year) { toast({ title: "Year and title required", variant: "destructive" }); return; }
    if (editingId) {
      await supabase.from("memorial_journey_events" as any).update({
        year: form.year, title: form.title, description: form.description || null,
      } as any).eq("id", editingId);
    } else {
      await supabase.from("memorial_journey_events" as any).insert({
        memorial_id: memorialId, year: form.year, title: form.title,
        description: form.description || null, sort_order: events.length,
      } as any);
    }
    setForm({ year: birthYear, title: "", description: "" });
    setShowForm(false);
    setEditingId(null);
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this event?")) return;
    await supabase.from("memorial_journey_events" as any).delete().eq("id", id);
    loadEvents();
  };

  const handleEdit = (event: JourneyEvent) => {
    setForm({ year: event.year, title: event.title, description: event.description || "" });
    setEditingId(event.id);
    setShowForm(true);
  };

  if (loading) return null;
  if (events.length === 0 && !canEdit) return null;

  return (
    <section className="mb-12">
      <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <span className="text-primary font-body text-sm tracking-widest uppercase">The Journey</span>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
          Moments That<br />Defined a Life
        </h2>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Center line (desktop only) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

        <div className="space-y-2 md:space-y-8">
          {events.map((event, i) => (
            <TimelineItem
              key={event.id}
              event={event}
              index={i}
              isOwner={canEdit}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </div>

      {/* Add event form */}
      {canEdit && (
        <div className="mt-8 flex justify-center">
          {showForm ? (
            <motion.div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h4 className="font-display text-base font-semibold text-foreground">{editingId ? "Edit Event" : "Add Journey Event"}</h4>
              <Input type="number" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 0 }))} />
              <Input placeholder="Title (e.g. A Star is Born)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}><X className="w-4 h-4" /></Button>
                <Button variant="hero" size="sm" onClick={handleSave} className="gap-1"><Save className="w-4 h-4" /> Save</Button>
              </div>
            </motion.div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { setForm({ year: birthYear, title: "", description: "" }); setShowForm(true); }} className="gap-1">
              <Plus className="w-4 h-4" /> Add Journey Event
            </Button>
          )}
        </div>
      )}
    </section>
  );
};

export default JourneyTimeline;

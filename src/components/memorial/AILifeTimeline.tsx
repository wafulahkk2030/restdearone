import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  memorialId: string;
  memorialName: string;
  storiesCount: number;
}

interface TimelineEntry {
  period: string;
  title: string;
  description: string;
}

const AILifeTimeline = ({ memorialId, memorialName, storiesCount }: Props) => {
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  if (storiesCount < 3) return null;

  const generateTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-life-timeline", {
        body: { memorial_id: memorialId },
      });
      if (fnError) throw fnError;
      if (data?.timeline && data.timeline.length > 0) {
        setTimeline(data.timeline);
      } else {
        setError(data?.reason || "Could not generate timeline");
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error generating timeline", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const periodColors: Record<string, string> = {
    "Early Life": "bg-sage/20 text-sage border-sage/30",
    "Career": "bg-primary/20 text-primary border-primary/30",
    "Family": "bg-warm/20 text-warm border-warm/30",
    "Legacy": "bg-accent text-accent-foreground border-border",
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">AI Life Timeline</h3>
        </div>
        {!timeline && (
          <Button variant="outline" size="sm" onClick={generateTimeline} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate from Stories"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-body mb-4">
        AI reconstructs a biography from the collective memories shared about {memorialName}.
      </p>

      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      <AnimatePresence>
        {timeline && (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {timeline.map((entry, i) => {
              const colorClass = periodColors[entry.period] || "bg-muted text-muted-foreground border-border";
              return (
                <motion.div
                  key={i}
                  className="flex gap-4 items-start"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-body border ${colorClass}`}>
                    {entry.period}
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{entry.description}</p>
                  </div>
                </motion.div>
              );
            })}
            <Button variant="outline" size="sm" onClick={generateTimeline} disabled={loading} className="gap-1 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Regenerate
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AILifeTimeline;

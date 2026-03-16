import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FLOWER_TIERS } from "./FlowerTributeDialog";

interface Props {
  memorialId: string;
}

const TributeGarden = ({ memorialId }: Props) => {
  const [tributes, setTributes] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadTributes();
  }, [memorialId]);

  const loadTributes = async () => {
    const { data } = await supabase
      .from("flower_tributes")
      .select("*")
      .eq("memorial_id", memorialId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });
    setTributes(data || []);
  };

  if (tributes.length === 0) return null;

  // Count by type
  const counts: Record<string, number> = {};
  tributes.forEach(t => {
    counts[t.flower_type] = (counts[t.flower_type] || 0) + 1;
  });

  // Garden density based on total
  const total = tributes.length;
  const gardenClass = total >= 50 ? "bg-gradient-to-br from-sage/20 via-warm/10 to-primary/10" :
    total >= 20 ? "bg-gradient-to-br from-sage/15 to-warm/5" :
    total >= 5 ? "bg-sage/5" : "bg-card";

  return (
    <div className={`rounded-xl border border-border p-6 mb-10 ${gardenClass}`}>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">🌸 Tribute Garden</h3>
      <p className="text-xs text-muted-foreground font-body mb-4">{total} tribute{total !== 1 ? "s" : ""} received</p>

      {/* Counts */}
      <div className="flex flex-wrap gap-3 mb-6">
        {FLOWER_TIERS.filter(f => counts[f.type]).map(f => (
          <div key={f.type} className="flex items-center gap-1.5 text-sm font-body">
            <span>{f.emoji}</span>
            <span className="text-foreground font-medium">{counts[f.type]}</span>
            <span className="text-muted-foreground">{f.name}{counts[f.type] > 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>

      {/* Recent tributes */}
      <div className="space-y-2">
        {tributes.slice(0, 10).map((t, i) => {
          const tier = FLOWER_TIERS.find(f => f.type === t.flower_type);
          const isExpanded = expanded === t.id;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : t.id)}
            >
              <div className="flex items-center gap-2 text-sm font-body">
                <span>{tier?.emoji}</span>
                <span className="text-foreground">
                  <span className="font-medium">{t.sender_name}</span>
                  {" offered a "}
                  <span className="font-medium">{tier?.name}</span>
                </span>
                <span className="text-muted-foreground text-xs ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              {isExpanded && t.tribute_note && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-foreground/70 font-body italic ml-6 mt-1"
                >
                  "{t.tribute_note}"
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TributeGarden;

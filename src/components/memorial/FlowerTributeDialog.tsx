import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const FLOWER_TIERS = [
  { type: "memory_daisy", name: "Memory Daisy", price: 250, emoji: "🌼", meaning: "A simple remembrance" },
  { type: "grace_lily", name: "Grace Lily", price: 500, emoji: "🌸", meaning: "Honor and peace" },
  { type: "golden_rose", name: "Golden Rose", price: 750, emoji: "🌹", meaning: "Deep admiration" },
  { type: "eternal_orchid", name: "Eternal Orchid", price: 1000, emoji: "🌺", meaning: "Lasting love" },
  { type: "heaven_blossom", name: "Heaven Blossom", price: 3000, emoji: "💐", meaning: "Celebrating a beautiful life" },
  { type: "legacy_bouquet", name: "Legacy Bouquet", price: 5000, emoji: "🌻", meaning: "Honoring a powerful legacy" },
  { type: "celestial_garden", name: "Celestial Garden", price: 10000, emoji: "🌷", meaning: "A grand tribute" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memorialId: string;
  memorialName: string;
}

const FlowerTributeDialog = ({ open, onOpenChange, memorialId, memorialName }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }
    if (!selected) { toast({ title: "Please select a flower", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-flower-tribute", {
        body: { memorial_id: memorialId, flower_type: selected, tribute_note: note },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const selectedTier = FLOWER_TIERS.find(f => f.type === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Offer a Tribute Flower</DialogTitle>
          <DialogDescription className="font-body text-sm">
            Honor the memory of {memorialName} with a beautiful flower tribute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {FLOWER_TIERS.map(tier => (
            <button
              key={tier.type}
              onClick={() => setSelected(tier.type)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                selected === tier.type
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{tier.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold text-foreground">{tier.name}</p>
                <p className="text-xs text-muted-foreground font-body">{tier.meaning}</p>
              </div>
              <span className="text-sm font-body font-medium text-foreground whitespace-nowrap">KES {tier.price.toLocaleString()}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder="Write an optional tribute note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="min-h-[80px]"
            />
            <Button variant="hero" className="w-full" onClick={handleSend} disabled={loading}>
              {loading ? "Processing..." : `Offer ${selectedTier?.name} — KES ${selectedTier?.price.toLocaleString()}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { FLOWER_TIERS };
export default FlowerTributeDialog;

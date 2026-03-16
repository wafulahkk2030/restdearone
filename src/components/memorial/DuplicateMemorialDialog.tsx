import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MatchingMemorial {
  id: string;
  full_name: string;
  birth_year: number;
  death_year: number;
  relationship_to_creator: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: MatchingMemorial[];
  onConfirmNew: () => void;
  onSelectExisting: (id: string) => void;
}

const DuplicateMemorialDialog = ({ open, onOpenChange, matches, onConfirmNew, onSelectExisting }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Is this the person?</DialogTitle>
          <DialogDescription className="font-body text-sm">
            We found existing memorial pages that might match. Please check if any of these are the same person.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto">
          {matches.map(m => (
            <button
              key={m.id}
              onClick={() => onSelectExisting(m.id)}
              className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all"
            >
              <p className="font-display text-sm font-semibold text-foreground">{m.full_name}</p>
              <p className="text-xs text-muted-foreground font-body">{m.birth_year} – {m.death_year}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="hero" className="w-full" onClick={onConfirmNew}>
            No, this is a different person — Create New Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateMemorialDialog;

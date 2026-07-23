import { Construction } from "lucide-react";

interface Props {
  title: string;
  description?: string;
}

const PlaceholderPanel = ({ title, description }: Props) => (
  <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
    <Construction className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
    <h3 className="font-display text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground font-body max-w-md mx-auto">
      {description || "This module is scaffolded. Ask to build it out and I'll wire the data, actions, and permissions."}
    </p>
    <span className="inline-block mt-4 text-xs font-body px-3 py-1 rounded-full bg-accent text-accent-foreground">
      Coming soon
    </span>
  </div>
);

export default PlaceholderPanel;
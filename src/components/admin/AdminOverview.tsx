import { BookOpen, Users, Flag, CreditCard, Activity, MessageSquare } from "lucide-react";

interface Stats {
  memorials: number;
  stories: number;
  users: number;
  reports: number;
  payments: number;
  communities: number;
}

const AdminOverview = ({ stats }: { stats: Stats }) => {
  const items = [
    { label: "Memorial Pages", value: stats.memorials, icon: BookOpen, color: "text-primary" },
    { label: "Stories", value: stats.stories, icon: BookOpen, color: "text-primary" },
    { label: "Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Communities", value: stats.communities, icon: MessageSquare, color: "text-primary" },
    { label: "Reports", value: stats.reports, icon: Flag, color: "text-destructive" },
    { label: "Payments", value: stats.payments, icon: CreditCard, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 text-center">
            <Icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminOverview;

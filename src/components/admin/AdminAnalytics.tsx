import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, BookOpen, DollarSign, MessageSquare, Activity } from "lucide-react";

const AdminAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("analytics-dashboard");
      setData(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground font-body text-center py-8">Loading analytics...</p>;
  if (!data) return <p className="text-muted-foreground font-body text-center py-8">Analytics unavailable.</p>;

  const kpis = [
    { label: "Daily Active", value: data.daily_active, icon: Activity },
    { label: "New Memorials (7d)", value: data.weekly_memorials, icon: BookOpen },
    { label: "Stories (7d)", value: data.weekly_stories, icon: BookOpen },
    { label: "Total Users", value: data.total_users, icon: Users },
    { label: "Active Memorials", value: data.active_memorials, icon: TrendingUp },
    { label: "Communities", value: data.total_communities, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-border rounded-xl p-5 text-center">
              <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground font-body">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Revenue (completed)</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-xs text-muted-foreground font-body">Memorials & tributes</p><p className="font-display text-xl font-bold">KES {(data.revenue?.memorials || 0).toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground font-body">Communities</p><p className="font-display text-xl font-bold">KES {(data.revenue?.communities || 0).toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground font-body">Total</p><p className="font-display text-xl font-bold text-primary">KES {(data.revenue?.total || 0).toLocaleString()}</p></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Top Communities</h3>
        <div className="space-y-2">
          {(data.top_communities || []).map((c: any) => (
            <div key={c.id} className="flex justify-between items-center text-sm font-body">
              <span className="text-foreground">{c.name}</span>
              <span className="text-muted-foreground">{c.member_count} members · {c.story_count} stories</span>
            </div>
          ))}
          {(data.top_communities || []).length === 0 && <p className="text-xs text-muted-foreground font-body">No communities yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
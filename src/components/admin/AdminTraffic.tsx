import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, Globe, Smartphone, Lightbulb, Clock, Loader2 } from "lucide-react";

type Bar = { label: string; count: number };

const BarList = ({ title, icon: Icon, items, empty }: { title: string; icon: any; items: Bar[]; empty: string }) => {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.label}>
            <div className="flex justify-between text-xs font-body mb-1">
              <span className="text-foreground truncate pr-2">{i.label}</span>
              <span className="text-muted-foreground">{i.count.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(i.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground font-body">{empty}</p>}
      </div>
    </div>
  );
};

const AdminTraffic = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("traffic-analytics", { body: { days: d } });
    if (error) console.error("traffic-analytics failed", error);
    setData(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  if (loading) return <div className="flex items-center gap-2 py-8 text-muted-foreground font-body"><Loader2 className="w-4 h-4 animate-spin" /> Loading traffic…</div>;
  if (!data) return <p className="text-muted-foreground font-body py-8">Traffic data unavailable.</p>;

  const s = data.summary || {};
  const kpis = [
    { label: "Page views", value: s.total_views, icon: Eye },
    { label: "Visits (sessions)", value: s.unique_sessions, icon: Users },
    { label: "Signed-in views", value: s.signed_in_views, icon: Users },
    { label: "Known people", value: s.known_users, icon: Users },
    { label: "Pages per visit", value: s.views_per_session, icon: Globe },
    { label: "Visitors not signed in", value: `${s.anonymous_share ?? 0}%`, icon: Smartphone },
  ];

  const peak = (data.by_hour || []).reduce((a: any, b: any) => (b.count > (a?.count ?? -1) ? b : a), null);
  const maxDay = Math.max(1, ...(data.by_day || []).map((d: any) => d.count));

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body transition-colors ${d === days ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-border rounded-xl p-5 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{k.value ?? 0}</p>
              <p className="text-xs text-muted-foreground font-body">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground text-sm mb-4">Visits over time</h3>
        <div className="flex items-end gap-1 h-28">
          {(data.by_day || []).map((d: any) => (
            <div key={d.date} className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-colors" style={{ height: `${(d.count / maxDay) * 100}%` }} title={`${d.date}: ${d.count}`} />
          ))}
          {(data.by_day || []).length === 0 && <p className="text-xs text-muted-foreground font-body">No visits recorded yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarList title="What they read (top pages)" icon={Eye} items={data.top_pages || []} empty="No pages yet." />
        <BarList title="Where they came from" icon={Globe} items={data.top_referrers || []} empty="No sources yet." />
        <BarList title="Campaign links" icon={Globe} items={data.campaigns || []} empty="No tagged links used yet." />
        <BarList title="Devices" icon={Smartphone} items={data.devices || []} empty="No devices yet." />
        <BarList title="Browsers" icon={Smartphone} items={data.browsers || []} empty="No browsers yet." />
        <BarList title="Regions (time zones)" icon={Globe} items={data.timezones || []} empty="No regions yet." />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">When they visit</h3>
        </div>
        <div className="flex items-end gap-1 h-20">
          {(data.by_hour || []).map((h: any) => {
            const max = Math.max(1, ...(data.by_hour || []).map((x: any) => x.count));
            return <div key={h.hour} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${(h.count / max) * 100}%` }} title={`${h.hour}:00 UTC — ${h.count}`} />;
          })}
        </div>
        {peak && <p className="text-xs text-muted-foreground font-body mt-2">Busiest hour: {peak.hour}:00 UTC ({peak.count} views)</p>}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Why this is happening — recommendations</h3>
        </div>
        <ul className="space-y-2">
          {(data.recommendations || []).map((r: string, i: number) => (
            <li key={i} className="text-sm font-body text-foreground flex gap-2">
              <span className="text-primary">{i + 1}.</span>
              <span>{r}</span>
            </li>
          ))}
          {(data.recommendations || []).length === 0 && (
            <p className="text-xs text-muted-foreground font-body">Recommendations appear once there is enough visit data.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AdminTraffic;

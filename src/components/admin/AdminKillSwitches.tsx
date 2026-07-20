import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Power, Save } from "lucide-react";

type Settings = {
  payments_enabled: boolean;
  signups_enabled: boolean;
  memorial_creation_enabled: boolean;
  story_creation_enabled: boolean;
  community_creation_enabled: boolean;
  fundraiser_creation_enabled: boolean;
  chat_enabled: boolean;
  comments_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  banner_message: string | null;
  banner_active: boolean;
};

const SWITCHES: { key: keyof Settings; label: string; desc: string; critical?: boolean }[] = [
  { key: "maintenance_mode", label: "Maintenance Mode", desc: "Blocks all non-admin routes with a maintenance page", critical: true },
  { key: "signups_enabled", label: "New Signups", desc: "Allow new users to register", critical: true },
  { key: "payments_enabled", label: "Payments", desc: "Master switch for Paystack checkouts", critical: true },
  { key: "memorial_creation_enabled", label: "Memorial Creation", desc: "Users can create new memorial pages" },
  { key: "story_creation_enabled", label: "Story Creation", desc: "Users can post stories" },
  { key: "community_creation_enabled", label: "Community Creation", desc: "Users can create paid communities" },
  { key: "fundraiser_creation_enabled", label: "Fundraiser Creation", desc: "Users can start fundraisers" },
  { key: "chat_enabled", label: "Chat", desc: "Direct/group chat feature" },
  { key: "comments_enabled", label: "Comments", desc: "Global comment posting" },
];

const AdminKillSwitches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from as any)("site_settings").select("*").eq("id", true).single();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await (supabase.from as any)("site_settings")
      .update({ ...settings, updated_by: user?.id })
      .eq("id", true);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
      await supabase.from("admin_activity_logs").insert({
        admin_id: user!.id,
        action: "update_site_settings",
        target_type: "site_settings",
        details: settings as any,
      });
    }
  };

  if (loading || !settings) return <p className="text-muted-foreground font-body text-center py-8">Loading kill switches...</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-semibold text-foreground text-sm">System Controls</p>
          <p className="text-xs text-muted-foreground font-body">Kill switches take effect immediately for every user. Use with care.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {SWITCHES.map(s => (
          <div key={s.key} className={`bg-card border rounded-xl p-4 flex items-start justify-between gap-4 ${s.critical ? "border-destructive/40" : "border-border"}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Power className={`w-4 h-4 ${(settings as any)[s.key] ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-display font-semibold text-sm text-foreground">{s.label}</p>
                {s.critical && <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">critical</span>}
              </div>
              <p className="text-xs text-muted-foreground font-body mt-1">{s.desc}</p>
            </div>
            <Switch
              checked={!!(settings as any)[s.key]}
              onCheckedChange={v => setSettings(prev => prev ? { ...prev, [s.key]: v } as Settings : prev)}
            />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-body text-sm">Global Banner</Label>
          <Switch checked={settings.banner_active} onCheckedChange={v => setSettings({ ...settings, banner_active: v })} />
        </div>
        <Input
          placeholder="Banner text shown site-wide"
          value={settings.banner_message || ""}
          onChange={e => setSettings({ ...settings, banner_message: e.target.value })}
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <Label className="font-body text-sm">Maintenance Message</Label>
        <Textarea
          placeholder="Shown when maintenance mode is on"
          value={settings.maintenance_message || ""}
          onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
        />
      </div>

      <Button variant="hero" onClick={save} disabled={saving} className="gap-2">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
};

export default AdminKillSwitches;
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

const AdminBroadcast = () => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<"all" | "one">("all");
  const [who, setWho] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) return toast({ title: "Write a message first", variant: "destructive" });
    setSending(true);
    try {
      let userIds: string[] = [];
      if (target === "one") {
        const term = who.trim();
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .or(`email.eq.${term},username.eq.${term}`)
          .maybeSingle();
        if (!prof) throw new Error("User not found");
        userIds = [prof.id];
      } else {
        const { data } = await supabase.from("profiles").select("id").limit(5000);
        userIds = (data || []).map((p) => p.id);
      }
      if (!userIds.length) throw new Error("No recipients found");

      const payload = userIds.map((id) => ({ user_id: id, message: message.trim(), link: link.trim() || null }));
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await supabase.from("notifications").insert(payload.slice(i, i + 500));
        if (error) throw error;
      }
      toast({ title: `Sent to ${userIds.length} user(s)` });
      setMessage("");
      setLink("");
    } catch (e: any) {
      toast({ title: "Could not send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <Button variant={target === "all" ? "default" : "outline"} size="sm" onClick={() => setTarget("all")}>
          Everyone
        </Button>
        <Button variant={target === "one" ? "default" : "outline"} size="sm" onClick={() => setTarget("one")}>
          A single user
        </Button>
      </div>
      {target === "one" && (
        <Input placeholder="User email or username" value={who} onChange={(e) => setWho(e.target.value)} />
      )}
      <textarea
        className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
        placeholder="Your announcement…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Input placeholder="Optional link (e.g. /memorial/123)" value={link} onChange={(e) => setLink(e.target.value)} />
      <Button onClick={send} disabled={sending}>
        {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Send notification
      </Button>
    </div>
  );
};

export default AdminBroadcast;
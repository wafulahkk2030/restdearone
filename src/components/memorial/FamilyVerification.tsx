import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, Clock, XCircle } from "lucide-react";

interface Props {
  memorialId: string;
  memorialName: string;
}

const FamilyVerification = ({ memorialId, memorialName }: Props) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ relationship: "", evidence_text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [myRequest, setMyRequest] = useState<any>(null);

  useEffect(() => { loadVerifications(); }, [memorialId]);

  const loadVerifications = async () => {
    const { data } = await supabase.from("family_verifications")
      .select("*, profiles:user_id(display_name, username)")
      .eq("memorial_id", memorialId);
    setVerifications(data || []);
    if (user) {
      const mine = (data || []).find((v: any) => v.user_id === user.id);
      setMyRequest(mine || null);
    }
  };

  const submitRequest = async () => {
    if (!user || !form.relationship) return;
    setSubmitting(true);
    const { error } = await supabase.from("family_verifications").insert({
      memorial_id: memorialId,
      user_id: user.id,
      relationship: form.relationship,
      evidence_text: form.evidence_text || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification requested", description: "An admin will review your request." });
      setShowForm(false);
      setForm({ relationship: "", evidence_text: "" });
      loadVerifications();
    }
  };

  const handleAdminAction = async (id: string, status: string) => {
    await supabase.from("family_verifications").update({ status, reviewed_by: user?.id }).eq("id", id);
    toast({ title: `Request ${status}` });
    loadVerifications();
  };

  const verified = verifications.filter(v => v.status === "verified");
  const pending = verifications.filter(v => v.status === "pending");

  return (
    <div className="mb-10">
      {/* Verified family badges */}
      {verified.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Verified Family
          </h3>
          <div className="flex flex-wrap gap-2">
            {verified.map(v => (
              <div key={v.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-body">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-primary">{v.profiles?.display_name || v.profiles?.username}</span>
                <span className="text-muted-foreground">— {v.relationship}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request verification */}
      {user && !myRequest && (
        <div>
          {!showForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1">
              <Shield className="w-4 h-4" /> Request Family Verification
            </Button>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3 mt-2">
              <h4 className="font-display text-sm font-semibold text-foreground">Verify Your Relationship to {memorialName}</h4>
              <Input placeholder="Your relationship (e.g. daughter, nephew)" value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} />
              <Textarea placeholder="Describe how you're related (optional)" value={form.evidence_text}
                onChange={e => setForm(f => ({ ...f, evidence_text: e.target.value }))} className="min-h-[80px]" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button variant="hero" size="sm" onClick={submitRequest} disabled={submitting || !form.relationship}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show user's pending request */}
      {myRequest && myRequest.status === "pending" && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm/10 border border-warm/20 text-xs font-body text-warm">
          <Clock className="w-3.5 h-3.5" /> Your verification request is pending review
        </div>
      )}
      {myRequest && myRequest.status === "rejected" && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-body text-destructive">
          <XCircle className="w-3.5 h-3.5" /> Your verification request was not approved
        </div>
      )}

      {/* Admin: review pending */}
      {isAdmin && pending.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-body font-semibold text-muted-foreground uppercase">Pending Verification Requests</h4>
          {pending.map(v => (
            <div key={v.id} className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-foreground">{v.profiles?.display_name || v.profiles?.username} — {v.relationship}</p>
                {v.evidence_text && <p className="text-xs text-muted-foreground font-body">{v.evidence_text}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="hero" size="sm" onClick={() => handleAdminAction(v.id, "verified")}>Verify</Button>
                <Button variant="outline" size="sm" onClick={() => handleAdminAction(v.id, "rejected")}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyVerification;

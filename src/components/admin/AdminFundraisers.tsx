import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Edit, Eye, Star, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AdminFundraisersProps {
  userId: string;
}

const HIGHLIGHT_TIERS = [
  { value: "3_days", label: "3 Days — KES 500", days: 3 },
  { value: "7_days", label: "7 Days — KES 1,000", days: 7 },
  { value: "14_days", label: "14 Days — KES 2,000", days: 14 },
];

const AdminFundraisers = ({ userId }: AdminFundraisersProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending_approval");
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showHighlight, setShowHighlight] = useState<string | null>(null);
  const [highlightTier, setHighlightTier] = useState("3_days");
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    const query = supabase.from("fundraisers").select("*, profiles:created_by(display_name, username, email)").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") {
      query.eq("status", filter);
    }
    const { data } = await query;
    setFundraisers(data || []);
    setLoading(false);
  };

  const approve = async (id: string) => {
    await supabase.from("fundraisers").update({ status: "active" } as any).eq("id", id);
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId, action: "approve_fundraiser", target_type: "fundraiser", target_id: id,
    });
    toast({ title: "Fundraiser approved and live!" });
    load();
  };

  const reject = async () => {
    if (!showReject || !rejectReason) return;
    await supabase.from("fundraisers").update({ status: "rejected", rejection_reason: rejectReason } as any).eq("id", showReject);
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId, action: "reject_fundraiser", target_type: "fundraiser", target_id: showReject, details: { reason: rejectReason },
    });
    toast({ title: "Fundraiser rejected" });
    setShowReject(null);
    setRejectReason("");
    load();
  };

  const requestEdit = async () => {
    if (!showEdit || !editNote) return;
    await supabase.from("fundraisers").update({ admin_notes: editNote } as any).eq("id", showEdit);
    // Send notification to creator
    const f = fundraisers.find(x => x.id === showEdit);
    if (f) {
      await supabase.from("notifications").insert({
        user_id: f.created_by,
        message: `Your fundraiser "${f.title}" needs revision: ${editNote}`,
        link: `/fundraise/${f.id}`,
      });
    }
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId, action: "request_edit_fundraiser", target_type: "fundraiser", target_id: showEdit,
    });
    toast({ title: "Edit request sent to creator" });
    setShowEdit(null);
    setEditNote("");
    load();
  };

  const setHighlight = async () => {
    if (!showHighlight) return;
    const tier = HIGHLIGHT_TIERS.find(t => t.value === highlightTier);
    if (!tier) return;
    const until = new Date();
    until.setDate(until.getDate() + tier.days);
    await supabase.from("fundraisers").update({
      highlight_until: until.toISOString(),
      highlight_tier: highlightTier,
    } as any).eq("id", showHighlight);
    await supabase.from("admin_activity_logs").insert({
      admin_id: userId, action: "highlight_fundraiser", target_type: "fundraiser", target_id: showHighlight, details: { tier: highlightTier },
    });
    toast({ title: "Fundraiser highlighted!" });
    setShowHighlight(null);
    load();
  };

  const statusColors: Record<string, string> = {
    pending_approval: "bg-accent text-accent-foreground",
    active: "bg-primary/20 text-primary",
    rejected: "bg-destructive/20 text-destructive",
    closed: "bg-muted text-muted-foreground",
    paid: "bg-sage/20 text-sage",
    completed: "bg-sage/20 text-sage",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {["pending_approval", "active", "rejected", "closed", "paid", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-colors ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
            }`}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? <p className="text-muted-foreground font-body">Loading...</p> : (
        <div className="space-y-3">
          {fundraisers.length === 0 && <p className="text-muted-foreground font-body text-center py-8">No fundraisers found.</p>}
          {fundraisers.map(f => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-base font-semibold text-foreground">{f.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-body ${statusColors[f.status] || "bg-muted text-muted-foreground"}`}>
                      {f.status?.replace(/_/g, " ")}
                    </span>
                    {f.highlight_until && new Date(f.highlight_until) > new Date() && (
                      <span className="text-xs text-primary font-body flex items-center gap-1"><Star className="w-3 h-3" /> Spotlight</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    By: {f.profiles?.display_name || f.profiles?.username || f.profiles?.email || "Unknown"}
                    {f.relationship_to_deceased && ` · ${f.relationship_to_deceased}`}
                  </p>
                  {f.personal_statement && (
                    <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">{f.personal_statement}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    KES {f.current_amount?.toLocaleString()} / {f.target_amount?.toLocaleString()}
                    {f.deadline && ` · Deadline: ${new Date(f.deadline).toLocaleDateString()}`}
                  </p>
                  {f.admin_notes && (
                    <p className="text-xs text-warm font-body mt-1">Admin note: {f.admin_notes}</p>
                  )}
                  {f.rejection_reason && (
                    <p className="text-xs text-destructive font-body mt-1">Rejection: {f.rejection_reason}</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/fundraise/${f.id}`)} title="View">
                    <Eye className="w-3 h-3" />
                  </Button>
                  {f.status === "pending_approval" && (
                    <>
                      <Button size="sm" variant="sage" onClick={() => approve(f.id)} title="Approve">
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setShowReject(f.id)} title="Reject">
                        <XCircle className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowEdit(f.id)} title="Request Edit">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {f.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => setShowHighlight(f.id)} title="Community Spotlight">
                      <Star className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!showReject} onOpenChange={() => setShowReject(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Fundraiser</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <Button variant="destructive" onClick={reject} disabled={!rejectReason}>Reject</Button>
        </DialogContent>
      </Dialog>

      {/* Request edit dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Edit</DialogTitle>
            <DialogDescription>Tell the creator what to revise.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="e.g. Please clarify your relationship..." value={editNote} onChange={e => setEditNote(e.target.value)} />
          <Button variant="hero" onClick={requestEdit} disabled={!editNote}>Send Request</Button>
        </DialogContent>
      </Dialog>

      {/* Highlight dialog */}
      <Dialog open={!!showHighlight} onOpenChange={() => setShowHighlight(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Community Spotlight</DialogTitle>
            <DialogDescription>Set visibility boost duration.</DialogDescription>
          </DialogHeader>
          <Select value={highlightTier} onValueChange={setHighlightTier}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {HIGHLIGHT_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="hero" onClick={setHighlight}>Activate Spotlight</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFundraisers;

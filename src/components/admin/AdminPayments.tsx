import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";

const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [communityPayments, setCommunityPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [memP, comP] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("community_payments").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setPayments(memP.data || []);
      setCommunityPayments(comP.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground font-body text-center py-8">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Memorial Payments ({payments.length})
        </h3>
        <div className="space-y-2">
          {payments.length === 0 ? (
            <p className="text-muted-foreground font-body text-center py-4">No memorial payments yet.</p>
          ) : payments.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-foreground">{p.currency} {(p.amount / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground font-body">Ref: {p.payment_reference || 'N/A'} · {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
                p.status === 'success' ? 'bg-primary/20 text-primary' : p.status === 'pending' ? 'bg-accent text-accent-foreground' : 'bg-destructive/20 text-destructive'
              }`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Community Payments ({communityPayments.length})
        </h3>
        <div className="space-y-2">
          {communityPayments.length === 0 ? (
            <p className="text-muted-foreground font-body text-center py-4">No community payments yet.</p>
          ) : communityPayments.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-foreground">{p.currency} {p.amount}</p>
                <p className="text-xs text-muted-foreground font-body">{p.billing_cycle} · Ref: {p.payment_reference || 'N/A'} · {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
                p.status === 'success' ? 'bg-primary/20 text-primary' : p.status === 'pending' ? 'bg-accent text-accent-foreground' : 'bg-destructive/20 text-destructive'
              }`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;

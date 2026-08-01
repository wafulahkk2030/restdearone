import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminOverview from "./AdminOverview";
import { Loader2 } from "lucide-react";

const countOf = async (table: string) => {
  const { count } = await (supabase.from(table as any) as any).select("id", { count: "exact", head: true });
  return count || 0;
};

const AdminOverviewLive = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [memorials, stories, users, reports, payments, communities] = await Promise.all([
        countOf("memorial_pages"),
        countOf("stories"),
        countOf("profiles"),
        countOf("reports"),
        countOf("payments"),
        countOf("community_groups"),
      ]);
      setStats({ memorials, stories, users, reports, payments, communities });
    })();
  }, []);

  if (!stats) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  return <AdminOverview stats={stats} />;
};

export default AdminOverviewLive;
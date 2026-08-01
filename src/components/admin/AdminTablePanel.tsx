import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, Download, ChevronLeft, ChevronRight } from "lucide-react";

export interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "date" | "money" | "bool" | "json" | "image";
  width?: string;
}

export interface StatusAction {
  column: string;
  options: { value: string; label: string; variant?: "default" | "destructive" }[];
}

export interface CreateField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number";
  required?: boolean;
}

export interface AdminTablePanelProps {
  table: string;
  title?: string;
  description?: string;
  columns: ColumnDef[];
  searchColumns?: string[];
  orderBy?: { column: string; ascending?: boolean };
  baseFilter?: { column: string; value: any };
  statusAction?: StatusAction;
  allowDelete?: boolean;
  createFields?: CreateField[];
  pageSize?: number;
  emptyLabel?: string;
}

const fmt = (value: any, type?: ColumnDef["type"]) => {
  if (value === null || value === undefined || value === "") return "—";
  switch (type) {
    case "date":
      return new Date(value).toLocaleString();
    case "money":
      return `KES ${Number(value).toLocaleString()}`;
    case "bool":
      return value ? "Yes" : "No";
    case "json":
      return typeof value === "string" ? value : JSON.stringify(value);
    default: {
      const s = String(value);
      return s.length > 120 ? `${s.slice(0, 120)}…` : s;
    }
  }
};

const AdminTablePanel = ({
  table,
  title,
  description,
  columns,
  searchColumns = [],
  orderBy = { column: "created_at", ascending: false },
  baseFilter,
  statusAction,
  allowDelete = false,
  createFields,
  pageSize = 25,
  emptyLabel = "Nothing here yet.",
}: AdminTablePanelProps) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase.from(table as any) as any)
      .select("*", { count: "exact" })
      .order(orderBy.column, { ascending: orderBy.ascending ?? false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (baseFilter) q = q.eq(baseFilter.column, baseFilter.value);
    if (search.trim() && searchColumns.length) {
      const term = search.trim().replace(/[,()]/g, "");
      q = q.or(searchColumns.map((c) => `${c}.ilike.%${term}%`).join(","));
    }

    const { data, error, count: total } = await q;
    if (error) {
      toast({ title: "Could not load data", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows(data || []);
      setCount(total || 0);
    }
    setLoading(false);
  }, [table, page, search, baseFilter?.value, orderBy.column]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, value: string) => {
    if (!statusAction) return;
    setBusyId(id);
    const { error } = await (supabase.from(table as any) as any)
      .update({ [statusAction.column]: value })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Updated" });
    load();
  };

  const remove = async (id: string) => {
    setBusyId(id);
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
    setBusyId(null);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    load();
  };

  const create = async () => {
    if (!createFields) return;
    for (const f of createFields) {
      if (f.required && !form[f.key]?.trim()) {
        return toast({ title: `${f.label} is required`, variant: "destructive" });
      }
    }
    const payload: Record<string, any> = {};
    createFields.forEach((f) => {
      const v = form[f.key];
      if (v !== undefined && v !== "") payload[f.key] = f.type === "number" ? Number(v) : v;
    });
    setCreating(true);
    const { error } = await (supabase.from(table as any) as any).insert(payload);
    setCreating(false);
    if (error) return toast({ title: "Create failed", description: error.message, variant: "destructive" });
    toast({ title: "Created" });
    setForm({});
    load();
  };

  const exportCsv = () => {
    const head = columns.map((c) => c.label).join(",");
    const body = rows
      .map((r) => columns.map((c) => `"${String(fmt(r[c.key], c.type)).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}-page-${page + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground font-body">{description}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {searchColumns.length > 0 && (
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            className="max-w-xs"
          />
        )}
        <Button variant="outline" size="sm" onClick={() => load()}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
        <span className="text-xs text-muted-foreground font-body ml-auto">{count} record(s)</span>
      </div>

      {createFields && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-body font-medium text-foreground">Add new</p>
          <div className="grid gap-3 md:grid-cols-2">
            {createFields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs text-muted-foreground font-body">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <Button size="sm" onClick={create} disabled={creating}>
            {creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Create
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                {(statusAction || allowDelete) && <th className="px-4 py-2 text-right text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">
                    {emptyLabel}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-2 text-foreground max-w-xs">
                        {c.type === "image" && r[c.key] ? (
                          <img src={r[c.key]} alt="" className="w-12 h-12 object-cover rounded" loading="lazy" />
                        ) : (
                          fmt(r[c.key], c.type)
                        )}
                      </td>
                    ))}
                    {(statusAction || allowDelete) && (
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {statusAction?.options.map((o) => (
                            <Button
                              key={o.value}
                              size="sm"
                              variant={o.variant === "destructive" ? "destructive" : "outline"}
                              disabled={busyId === r.id || r[statusAction.column] === o.value}
                              onClick={() => setStatus(r.id, o.value)}
                            >
                              {o.label}
                            </Button>
                          ))}
                          {allowDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === r.id}
                              onClick={() => remove(r.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground font-body">
          Page {page + 1} of {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminTablePanel;
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Report {
  id: string;
  property_id: string;
  reason: string;
  details: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
  property_title?: string;
  property_listing_id?: string;
}

const AdminReportsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load reports");
        return [];
      }

      const rows = (data || []);
      const propertyIds = [...new Set(rows.map((r: any) => r.property_id))];
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title, listing_id")
        .in("id", propertyIds);

      const propMap = new Map((properties || []).map((p) => [p.id, p]));

      return rows.map((r: any) => ({
        ...r,
        property_title: propMap.get(r.property_id)?.title || "Unknown",
        property_listing_id: propMap.get(r.property_id)?.listing_id || "",
      })) as Report[];
    },
    staleTime: 30_000,
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("property_reports" as any)
      .update({ status } as any)
      .eq("id", id);

    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Report marked as ${status}`);
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase
      .from("property_reports" as any)
      .delete()
      .eq("id", id);

    if (error) { toast.error("Failed to delete report"); return; }
    toast.success("Report deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const statusColor = (s: string) => {
    if (s === "pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    if (s === "reviewed") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (s === "resolved") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    return "";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Property Reports</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({reports.length})</SelectItem>
                <SelectItem value="pending">Pending ({reports.filter(r => r.status === "pending").length})</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No reports found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <div key={report.id} className="border border-border rounded-lg p-4 bg-card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/property/${report.property_id}`} className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                        {report.property_title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {report.property_listing_id && (
                        <span className="text-xs text-muted-foreground">#{report.property_listing_id}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-destructive">{report.reason}</p>
                    {report.details && <p className="text-sm text-muted-foreground">{report.details}</p>}
                  </div>
                  <Badge className={`shrink-0 ${statusColor(report.status)}`}>{report.status}</Badge>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                  <div className="flex items-center gap-4">
                    {report.reporter_email && <span>✉ {report.reporter_email}</span>}
                    {report.reporter_phone && <span>☎ {report.reporter_phone}</span>}
                    {report.user_id && <span className="italic">Signed-in user</span>}
                    <span>{format(new Date(report.created_at), "dd MMM yyyy, HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status !== "reviewed" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "reviewed")}>
                        Mark Reviewed
                      </Button>
                    )}
                     {report.status !== "resolved" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, "resolved")}>
                        Resolve
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteReport(report.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReportsPage;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { format } from "date-fns";

const AdminAuditLogPage = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const targetColor = (type: string) => {
    const colors: Record<string, string> = {
      company: "bg-blue-100 text-blue-800",
      property: "bg-green-100 text-green-800",
      agent: "bg-purple-100 text-purple-800",
      membership: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">
              Last 100 Admin Actions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Timestamp</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Admin</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Action</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Target Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Target ID</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No audit log entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-mono text-xs">
                        {log.admin_user_id?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {log.action}
                      </TableCell>
                      <TableCell>
                        <Badge className={targetColor(log.target_type)} variant="secondary">
                          {log.target_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.target_id?.slice(0, 8) || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.new_value ? JSON.stringify(log.new_value).slice(0, 80) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogPage;

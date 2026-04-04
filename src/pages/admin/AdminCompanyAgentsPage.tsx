import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { turkishIncludes } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  credit_balance: number;
  created_at: string;
  profile_classification: string;
  downgraded_at: string | null;
}

const AdminCompanyAgentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [companyRes, agentsRes] = await Promise.all([
        supabase.from("companies").select("name").eq("id", id).maybeSingle(),
        supabase.from("agents")
          .select("id, name, email, phone, status, credit_balance, created_at, profile_classification, downgraded_at")
          .eq("company_id", id)
          .order("created_at", { ascending: false }),
      ]);
      setCompanyName(companyRes.data?.name || "Unknown");
      setAgents((agentsRes.data as Agent[]) || []);
      setLoading(false);
    })();
  }, [id]);

  const filtered = agents.filter(
    (a) => turkishIncludes(a.name, search) || turkishIncludes(a.email, search)
  );

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-emerald-100 text-emerald-800";
      case "pending": return "bg-amber-100 text-amber-800";
      case "inactive": return "bg-red-100 text-red-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/companies")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Company Agents</h1>
          <p className="text-sm text-muted-foreground">{companyName}</p>
        </div>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="text-xs uppercase tracking-wider font-semibold">#</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Email</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Phone</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Credits</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Classification</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No agents found</TableCell></TableRow>
              ) : (
                filtered.map((agent, idx) => (
                  <TableRow key={agent.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(agent.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{agent.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{agent.phone || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-primary">{agent.credit_balance}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{agent.profile_classification}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(agent.status)} variant="secondary">
                        {agent.status === "inactive" && agent.downgraded_at ? "Frozen" : agent.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanyAgentsPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AgentProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterType, setFilterType] = useState("all");
  const [filterProjectStatus, setFilterProjectStatus] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("id, company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!agent) return;
      const { data, error } = await supabase
        .from("projects")
        .select("id, listing_id, title, project_type, project_status, status, min_price, currency, created_at")
        .eq("company_id", agent.company_id)
        .order("created_at", { ascending: sortOrder === "oldest" });
      if (error) toast.error("Failed to load");
      else setProjects(data || []);
      setLoading(false);
    };
    fetch();
  }, [sortOrder]);

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const projectTypes = [...new Set(projects.map(p => p.project_type))];
  const projectStatuses = [...new Set(projects.map(p => p.project_status))];

  const filtered = projects.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.listing_id.includes(search)) return false;
    if (filterType !== "all" && p.project_type !== filterType) return false;
    if (filterProjectStatus !== "all" && p.project_status !== filterProjectStatus) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Projects</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
          <SelectTrigger className="w-[170px] bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters - always visible */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Project Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypes.map((t) => (<SelectItem key={t} value={t}>{formatType(t)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Project Status</label>
            <Select value={filterProjectStatus} onValueChange={setFilterProjectStatus}>
              <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {projectStatuses.map((s) => (<SelectItem key={s} value={s}>{formatType(s)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Listing Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">Projects</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} result(s)</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Price From</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No projects found.</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{p.listing_id}</TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="capitalize text-sm">{formatType(p.project_type)}</TableCell>
                <TableCell><Badge variant="secondary" className={p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>{p.status}</Badge></TableCell>
                <TableCell className="text-sm">{p.min_price ? `${p.currency} ${p.min_price.toLocaleString()}` : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/projects/${p.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AgentLayout>
  );
};

export default AgentProjectsPage;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Trash2, MoreVertical, Eye, Pencil, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Project {
  id: string;
  listing_id: string;
  title: string;
  project_type: string;
  project_status: string;
  location: string | null;
  status: string;
  created_at: string;
}

const CompanyProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  const fetchProjects = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, listing_id, title, project_type, project_status, location, status, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: sortOrder === "oldest" });
    if (error) toast.error("Failed to fetch projects");
    else setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { if (companyId) fetchProjects(); }, [companyId, sortOrder]);

  const filtered = projects.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.listing_id.includes(search)
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((p) => p.id));
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    const { error } = await supabase.from("projects").delete().in("id", selected);
    if (error) toast.error("Delete failed");
    else { toast.success(`${selected.length} project(s) deleted`); setSelected([]); fetchProjects(); }
  };

  const statusColor = (s: string) => {
    switch (s) { case "active": return "bg-emerald-100 text-emerald-800"; case "inactive": return "bg-red-100 text-red-800"; case "draft": return "bg-amber-100 text-amber-800"; default: return "bg-muted text-muted-foreground"; }
  };

  return (
    <CompanyLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Projects Management</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search By Title Or ID" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Sort By Date</span>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
            <SelectTrigger className="w-[170px] bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete ({selected.length})
            </Button>
          )}
          <Button onClick={() => navigate("/company/projects/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create New Project
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-10"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Creation Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Location</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No projects found.</TableCell></TableRow>
              ) : (
                filtered.map((proj) => (
                  <TableRow key={proj.id} className="hover:bg-muted/30">
                    <TableCell><Checkbox checked={selected.includes(proj.id)} onCheckedChange={() => toggleSelect(proj.id)} /></TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{proj.listing_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(proj.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{proj.project_type.replace("_", " ")}</TableCell>
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate">{proj.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{proj.location || "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(proj.status)} variant="secondary">
                        {proj.status.charAt(0).toUpperCase() + proj.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/projects/${proj.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/company/projects/${proj.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/company/projects/${proj.id}/units`)}>
                            <Layers className="h-4 w-4 mr-2" /> View Units
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyProjectsPage;

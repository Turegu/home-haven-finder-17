import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Pencil, Eye, RefreshCw, Ban, ArrowUpCircle, Crown, Star, LayoutList, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import UpgradeListingDialog from "@/components/company/UpgradeListingDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PerformanceInsightsTab from "@/components/analytics/PerformanceInsightsTab";

interface AgentProperty {
  id: string;
  listing_id: string;
  title: string;
  property_type: string;
  property_purpose: string;
  status: string;
  price: number | null;
  currency: string | null;
  created_at: string;
  property_classification: string | null;
}

const ITEMS_PER_PAGE = 10;

const AgentPropertiesPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "premium_first" | "featured_first">("newest");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; property: AgentProperty | null }>({ open: false, property: null });
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: agent } = await supabase.from("agents").select("id, company_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!agent) return;
    setCompanyId(agent.company_id);

    const { data, error } = await supabase
      .from("properties")
      .select("id, listing_id, title, property_type, property_purpose, status, price, currency, created_at, property_classification")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: sortOrder === "oldest" });

    if (error) toast.error("Failed to load");
    else {
      let results = data || [];
      if (sortOrder === "premium_first") {
        results = results.sort((a, b) => {
          const order = (c: string | null) => c === "premium" ? 0 : c === "featured" ? 1 : 2;
          return order(a.property_classification) - order(b.property_classification);
        });
      } else if (sortOrder === "featured_first") {
        results = results.sort((a, b) => {
          const order = (c: string | null) => c === "featured" ? 0 : c === "premium" ? 1 : 2;
          return order(a.property_classification) - order(b.property_classification);
        });
      }
      setProperties(results);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [sortOrder]);

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter(p => p.status === "active").length,
    inactive: properties.filter(p => p.status === "inactive").length,
    draft: properties.filter(p => p.status === "draft").length,
  }), [properties]);

  const handleDeactivate = async (prop: AgentProperty) => {
    const newStatus = prop.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", prop.id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Property ${newStatus === "active" ? "activated" : "deactivated"}`); fetchData(); }
  };

  const filtered = useMemo(() => properties.filter((p) => {
    if (search && !turkishIncludes(p.title, search) && !p.listing_id.includes(search)) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  }), [properties, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">My Properties</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-primary/10 p-2"><LayoutList className="h-4 w-4 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold text-foreground">{stats.total}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-emerald-100 p-2"><CheckCircle className="h-4 w-4 text-emerald-700" /></div>
          <div><p className="text-xs text-muted-foreground">Active</p><p className="text-lg font-bold text-emerald-700">{stats.active}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-red-100 p-2"><XCircle className="h-4 w-4 text-red-700" /></div>
          <div><p className="text-xs text-muted-foreground">Inactive</p><p className="text-lg font-bold text-red-700">{stats.inactive}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-amber-100 p-2"><FileText className="h-4 w-4 text-amber-700" /></div>
          <div><p className="text-xs text-muted-foreground">Draft</p><p className="text-lg font-bold text-amber-700">{stats.draft}</p></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Title or ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-secondary/50" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-secondary/50"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
          <SelectTrigger className="w-[190px] bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="premium_first">Premium First</SelectItem>
            <SelectItem value="featured_first">Featured First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-2">Showing {paginated.length} of {filtered.length} property(ies)</p>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Tier</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Purpose</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Price</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No properties assigned to you.</TableCell></TableRow>
            ) : paginated.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{p.listing_id}</TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="capitalize text-sm">{p.property_type}</TableCell>
                <TableCell>
                  {p.property_classification === "premium" ? (
                    <Badge className="bg-purple-100 text-purple-800 gap-1" variant="secondary"><Crown className="h-3 w-3" /> Premium</Badge>
                  ) : p.property_classification === "featured" ? (
                    <Badge className="bg-teal-100 text-teal-800 gap-1" variant="secondary"><Star className="h-3 w-3" /> Featured</Badge>
                  ) : <span className="text-xs text-muted-foreground">Standard</span>}
                </TableCell>
                <TableCell className="capitalize text-sm">{p.property_purpose}</TableCell>
                <TableCell className="text-sm">{p.price ? `${p.currency} ${p.price.toLocaleString()}` : "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={p.status === "active" ? "bg-emerald-100 text-emerald-800" : p.status === "inactive" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                    {p.status === "draft" ? "Unpublished" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/property/${p.id}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fetchData()}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/company/properties/${p.id}/edit`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivate(p)}><Ban className="h-4 w-4 mr-2" /> {p.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setUpgradeDialog({ open: true, property: p })}><ArrowUpCircle className="h-4 w-4 mr-2" /> Upgrade To Premium/Featured</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "ghost"} size="sm" onClick={() => setPage(p)} className="w-8 h-8">{p}</Button>
          ))}
          <Button variant="ghost" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {upgradeDialog.property && companyId && (
        <UpgradeListingDialog
          open={upgradeDialog.open}
          onOpenChange={(open) => setUpgradeDialog({ open, property: open ? upgradeDialog.property : null })}
          listingId={upgradeDialog.property.id}
          listingTitle={upgradeDialog.property.title}
          listingType="property"
          companyId={companyId}
          currentClassification={upgradeDialog.property.property_classification}
          onUpgraded={fetchData}
        />
      )}
    </AgentLayout>
  );
};

export default AgentPropertiesPage;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Trash2, MoreVertical, Eye, Pencil, RefreshCw, Home, Filter, X, Ban, UserPlus, ArrowUpCircle, Crown, Star, LayoutList, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import UpgradeListingDialog from "@/components/company/UpgradeListingDialog";
import AssignAgentDialog from "@/components/company/AssignAgentDialog";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PerformanceInsightsTab from "@/components/analytics/PerformanceInsightsTab";
import { useAnalyticsPhase } from "@/hooks/useAnalyticsPhase";
import DowngradedListingsBanner from "@/components/company/DowngradedListingsBanner";

interface Property {
  id: string;
  listing_id: string;
  title: string;
  property_status: string;
  property_purpose: string;
  property_type: string;
  property_classification: string | null;
  location: string | null;
  status: string;
  created_at: string;
  display_on_homepage: boolean;
  rooms: string | null;
  bathrooms: number | null;
  furniture: string | null;
  agent_id: string | null;
  agent_name?: string;
}

type ClassificationFilter = "all" | "residential_buy" | "residential_rent" | "commercial_buy" | "commercial_rent";

const ITEMS_PER_PAGE = 10;

const CompanyPropertiesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: analyticsPhase } = useAnalyticsPhase();
  const { data: companyData } = useCompanyId();
  const companyId = companyData?.id || null;

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "premium_first" | "featured_first">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  

  const [filterType, setFilterType] = useState("all");
  const [filterRooms, setFilterRooms] = useState("all");
  const [filterFurniture, setFilterFurniture] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });
  const [insightsDialog, setInsightsDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });

  const { options: filterOpts } = useFilterOptions("property");
  const { canCreate, membership, usage, limits, remainingSlots, refresh: refreshLimits } = useMembershipLimits(companyId);

  const { data: properties = [], isLoading: loading } = useQuery({
    queryKey: ["properties", companyId, sortOrder],
    queryFn: async () => {
      const ascending = sortOrder === "oldest";
      const { data, error } = await supabase
        .from("properties")
        .select("id, listing_id, title, property_status, property_purpose, property_type, property_classification, location, status, created_at, display_on_homepage, rooms, bathrooms, furniture, agent_id, agents(name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending });

      if (error) { toast.error("Failed to fetch properties"); return []; }

      let results = (data || []).map((p: any) => ({
        ...p,
        agent_name: p.agents?.name || null,
      }));
      if (sortOrder === "premium_first") {
        results.sort((a: any, b: any) => {
          const order = (c: string | null) => c === "premium" ? 0 : c === "featured" ? 1 : 2;
          return order(a.property_classification) - order(b.property_classification);
        });
      } else if (sortOrder === "featured_first") {
        results.sort((a: any, b: any) => {
          const order = (c: string | null) => c === "featured" ? 0 : c === "premium" ? 1 : 2;
          return order(a.property_classification) - order(b.property_classification);
        });
      }
      return results as Property[];
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const invalidateProperties = () => {
    queryClient.invalidateQueries({ queryKey: ["properties", companyId] });
  };

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter(p => p.status === "active").length,
    inactive: properties.filter(p => p.status === "inactive").length,
    draft: properties.filter(p => p.status === "draft").length,
  }), [properties]);

  const filtered = useMemo(() => properties.filter((p) => {
    if (search && !turkishIncludes(p.title, search) && !p.listing_id.includes(search)) return false;
    if (classificationFilter !== "all") {
      const cls = p.property_classification?.toLowerCase() || "residential";
      const purpose = p.property_purpose;
      switch (classificationFilter) {
        case "residential_buy": if (cls !== "residential" || purpose !== "buy") return false; break;
        case "residential_rent": if (cls !== "residential" || purpose !== "rent") return false; break;
        case "commercial_buy": if (cls !== "commercial" || purpose !== "buy") return false; break;
        case "commercial_rent": if (cls !== "commercial" || purpose !== "rent") return false; break;
      }
    }
    if (filterType !== "all" && p.property_type !== filterType) return false;
    if (filterRooms !== "all" && p.rooms !== filterRooms) return false;
    if (filterFurniture !== "all" && p.furniture !== filterFurniture) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  }), [properties, search, classificationFilter, filterType, filterRooms, filterFurniture, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const virtualizer = useVirtualizer({
    count: paginated.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const activeFilterCount = [filterType, filterRooms, filterFurniture, filterStatus].filter(f => f !== "all").length;

  const clearAllFilters = () => {
    setFilterType("all"); setFilterRooms("all"); setFilterFurniture("all"); setFilterStatus("all");
    setClassificationFilter("all"); setSearch(""); setPage(1);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const toggleAll = () => {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map((p) => p.id));
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("properties").delete().in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} property(ies) deleted`);
      setSelected([]);
      invalidateProperties();
      refreshLimits();
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleDelete = () => {
    if (selected.length === 0) return;
    deleteMutation.mutate(selected);
  };

  const deactivateMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(`Property ${newStatus === "active" ? "activated" : "deactivated"}`);
      invalidateProperties();
      refreshLimits();
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleDeactivate = (prop: Property) => {
    const newStatus = prop.status === "active" ? "inactive" : "active";
    if (newStatus === "active" && !canCreate("properties")) {
      toast.error(t("companyDashboard.noUpgradeAllowed", { membership }));
      return;
    }
    deactivateMutation.mutate({ id: prop.id, newStatus });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-emerald-100 text-emerald-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "draft": return "bg-amber-100 text-amber-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const propStatusColor = (s: string) => {
    switch (s) {
      case "new": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const propertyTypes = filterOpts["property_type"] || [];
  const roomOptions = filterOpts["rooms"] || [];
  const furnitureOptions = filterOpts["furniture"] || [];

  const maxProps = limits?.max_properties || 0;
  const usagePercent = maxProps > 0 ? Math.min(100, (usage.properties / maxProps) * 100) : 0;

  return (
    <CompanyLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("companyDashboard.propertiesManagement")}</h1>
      </div>

      <DowngradedListingsBanner companyId={companyId} tableName="properties" />

      {/* Membership Usage */}
      {maxProps > 0 ? (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("companyDashboard.propertiesUsed", { used: usage.properties, max: maxProps, membership: membership.charAt(0).toUpperCase() + membership.slice(1) })}
              </span>
              <span className="text-xs text-muted-foreground">{remainingSlots("properties")} {t("companyDashboard.remaining").toLowerCase()}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-primary/10 p-2"><LayoutList className="h-4 w-4 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">{t("companyDashboard.total")}</p><p className="text-lg font-bold text-foreground">{stats.total}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-emerald-100 p-2"><CheckCircle className="h-4 w-4 text-emerald-700" /></div>
          <div><p className="text-xs text-muted-foreground">{t("companyDashboard.active")}</p><p className="text-lg font-bold text-emerald-700">{stats.active}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-red-100 p-2"><XCircle className="h-4 w-4 text-red-700" /></div>
          <div><p className="text-xs text-muted-foreground">{t("companyDashboard.inactive")}</p><p className="text-lg font-bold text-red-700">{stats.inactive}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-amber-100 p-2"><FileText className="h-4 w-4 text-amber-700" /></div>
          <div><p className="text-xs text-muted-foreground">{t("companyDashboard.draft")}</p><p className="text-lg font-bold text-amber-700">{stats.draft}</p></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("companyDashboard.searchByTitleOrId")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-secondary/50" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">{t("companyDashboard.sortBy")}</span>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
            <SelectTrigger className="w-[190px] bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("companyDashboard.newestToOldest")}</SelectItem>
              <SelectItem value="oldest">{t("companyDashboard.oldestToNewest")}</SelectItem>
              <SelectItem value="premium_first">{t("companyDashboard.premiumFirst")}</SelectItem>
              <SelectItem value="featured_first">{t("companyDashboard.featuredFirst")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="h-4 w-4" /> {t("companyDashboard.filters")}
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary-foreground text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">{activeFilterCount}</span>
          )}
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> {t("companyDashboard.delete")} ({selected.length})
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled={!canCreate("properties")}
                    onClick={() => navigate("/company/properties/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" /> {t("companyDashboard.createNewProperty")}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canCreate("properties") && (
                <TooltipContent>
                  <p>{t("companyDashboard.limitReached", { type: t("companyDashboard.propertiesManagement") })}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Classification quick-filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([
          { key: "all", label: t("companyDashboard.allProperties") },
          { key: "residential_buy", label: t("companyDashboard.residentialForSaleFilter") },
          { key: "residential_rent", label: t("companyDashboard.residentialForRentFilter") },
          { key: "commercial_buy", label: t("companyDashboard.commercialForSaleFilter") },
          { key: "commercial_rent", label: t("companyDashboard.commercialForRentFilter") },
        ] as { key: ClassificationFilter; label: string }[]).map((chip) => (
          <button
            key={chip.key}
            onClick={() => { setClassificationFilter(chip.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              classificationFilter === chip.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">{t("companyDashboard.advancedFilters")}</h3>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> {t("companyDashboard.clearAll")}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("companyDashboard.propertyType")}</label>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder={t("companyDashboard.allTypes")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("companyDashboard.allTypes")}</SelectItem>
                  {propertyTypes.map((pt) => (<SelectItem key={pt} value={pt.toLowerCase()}>{pt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("companyDashboard.rooms")}</label>
              <Select value={filterRooms} onValueChange={(v) => { setFilterRooms(v); setPage(1); }}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder={t("companyDashboard.allRooms")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("companyDashboard.allRooms")}</SelectItem>
                  {roomOptions.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("companyDashboard.furniture")}</label>
              <Select value={filterFurniture} onValueChange={(v) => { setFilterFurniture(v); setPage(1); }}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder={t("companyDashboard.all")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("companyDashboard.all")}</SelectItem>
                  {furnitureOptions.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("companyDashboard.listingStatus")}</label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder={t("companyDashboard.all")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("companyDashboard.all")}</SelectItem>
                  <SelectItem value="active">{t("companyDashboard.active")}</SelectItem>
                  <SelectItem value="inactive">{t("companyDashboard.inactive")}</SelectItem>
                  <SelectItem value="draft">{t("companyDashboard.draft")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-2">{t("companyDashboard.showing", { count: paginated.length, total: filtered.length })}</p>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="w-10"><Checkbox checked={paginated.length > 0 && selected.length === paginated.length} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.id")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.creationDate")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.propertyStatus")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.contractType")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.type")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.tier")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.title")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.assignedAgent")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.location")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.homepage")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.status")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">{t("companyDashboard.options")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={13} className="text-center py-12 text-muted-foreground">{t("companyDashboard.loading")}</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={13} className="text-center py-12 text-muted-foreground">{t("companyDashboard.noData")}</TableCell></TableRow>
            ) : paginated.map((prop) => (
              <TableRow key={prop.id} className="hover:bg-muted/30">
                <TableCell><Checkbox checked={selected.includes(prop.id)} onCheckedChange={() => toggleSelect(prop.id)} /></TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">{prop.listing_id}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(prop.created_at), "dd/MM/yyyy hh:mm a")}</TableCell>
                <TableCell>
                  <Badge className={propStatusColor(prop.property_status)} variant="secondary">
                    {prop.property_status.charAt(0).toUpperCase() + prop.property_status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm capitalize">{prop.property_purpose}</TableCell>
                <TableCell className="text-sm capitalize">{prop.property_type}</TableCell>
                <TableCell>
                  {prop.property_classification === "premium" ? (
                    <Badge className="bg-purple-100 text-purple-800 gap-1" variant="secondary"><Crown className="h-3 w-3" /> {t("companyDashboard.premium")}</Badge>
                  ) : prop.property_classification === "featured" ? (
                    <Badge className="bg-teal-100 text-teal-800 gap-1" variant="secondary"><Star className="h-3 w-3" /> {t("companyDashboard.featured")}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("companyDashboard.standard")}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground max-w-[200px] truncate">{prop.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{prop.agent_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{prop.location || "—"}</TableCell>
                <TableCell>
                  {prop.display_on_homepage ? (
                    <Badge className="bg-amber-100 text-amber-800 gap-1" variant="secondary"><Home className="h-3 w-3" /> {t("companyDashboard.featured")}</Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge className={statusColor(prop.status)} variant="secondary">
                    {prop.status === "draft" ? t("companyDashboard.unpublished") : prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/property/${prop.id}`)}><Eye className="h-4 w-4 mr-2" /> {t("companyDashboard.view")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => invalidateProperties()}><RefreshCw className="h-4 w-4 mr-2" /> {t("companyDashboard.refresh")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/company/properties/${prop.id}/edit`)}><Pencil className="h-4 w-4 mr-2" /> {t("companyDashboard.edit")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivate(prop)}><Ban className="h-4 w-4 mr-2" /> {prop.status === "active" ? t("companyDashboard.deactivate") : t("companyDashboard.activate")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setAssignDialog({ open: true, property: prop })}><UserPlus className="h-4 w-4 mr-2" /> {t("companyDashboard.assignToAgent")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setUpgradeDialog({ open: true, property: prop })}><ArrowUpCircle className="h-4 w-4 mr-2" /> {t("companyDashboard.upgradeToPremiumFeatured")}</DropdownMenuItem>
                      {analyticsPhase !== 'off' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setInsightsDialog({ open: true, property: prop })}><BarChart3 className="h-4 w-4 mr-2" /> {t("companyDashboard.performanceInsights")}</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
          onUpgraded={invalidateProperties}
        />
      )}
      {assignDialog.property && companyId && (
        <AssignAgentDialog
          open={assignDialog.open}
          onOpenChange={(open) => setAssignDialog({ open, property: open ? assignDialog.property : null })}
          listingId={assignDialog.property.id}
          listingTitle={assignDialog.property.title}
          listingType="property"
          companyId={companyId}
          currentAgentId={assignDialog.property.agent_id}
          onAssigned={invalidateProperties}
        />
      )}
      {insightsDialog.property && (
        <Dialog open={insightsDialog.open} onOpenChange={(open) => setInsightsDialog({ open, property: open ? insightsDialog.property : null })}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("companyDashboard.performanceInsights")} — {insightsDialog.property.title}</DialogTitle>
            </DialogHeader>
            <PerformanceInsightsTab
              listingId={insightsDialog.property.id}
              listingType="property"
              listingTitle={insightsDialog.property.title}
            />
          </DialogContent>
        </Dialog>
      )}
    </CompanyLayout>
  );
};

export default CompanyPropertiesPage;

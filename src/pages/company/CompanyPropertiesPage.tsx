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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Trash2, MoreVertical, Eye, Pencil, RefreshCw, Home, Filter, X, Ban, UserPlus, ArrowUpCircle, Crown, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import UpgradeListingDialog from "@/components/company/UpgradeListingDialog";
import AssignAgentDialog from "@/components/company/AssignAgentDialog";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";

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
}

type ClassificationFilter = "all" | "residential_buy" | "residential_rent" | "commercial_buy" | "commercial_rent";

const CompanyPropertiesPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "premium_first" | "featured_first">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>("all");
  const [showFilters, setShowFilters] = useState(true);

  const [filterType, setFilterType] = useState("all");
  const [filterRooms, setFilterRooms] = useState("all");
  const [filterFurniture, setFilterFurniture] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog states
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; property: Property | null }>({ open: false, property: null });

  const { options: filterOpts } = useFilterOptions("property");
  const { canCreate, membership, remainingSlots, refresh: refreshLimits } = useMembershipLimits(companyId);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  const fetchProperties = async () => {
    if (!companyId) return;
    setLoading(true);
    const ascending = sortOrder === "oldest";
    let query = supabase
      .from("properties")
      .select("id, listing_id, title, property_status, property_purpose, property_type, property_classification, location, status, created_at, display_on_homepage, rooms, bathrooms, furniture, agent_id")
      .eq("company_id", companyId)
      .order("created_at", { ascending });

    const { data, error } = await query;

    if (error) toast.error("Failed to fetch properties");
    else {
      let results = data || [];
      // Client-side sort for premium/featured
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

  useEffect(() => {
    if (companyId) fetchProperties();
  }, [companyId, sortOrder]);

  const filtered = properties.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.listing_id.includes(search)) return false;
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
  });

  const activeFilterCount = [filterType, filterRooms, filterFurniture, filterStatus].filter(f => f !== "all").length;

  const clearAllFilters = () => {
    setFilterType("all");
    setFilterRooms("all");
    setFilterFurniture("all");
    setFilterStatus("all");
    setClassificationFilter("all");
    setSearch("");
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((p) => p.id));
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    const { error } = await supabase.from("properties").delete().in("id", selected);
    if (error) toast.error("Delete failed");
    else {
      toast.success(`${selected.length} property(ies) deleted`);
      setSelected([]);
      fetchProperties();
    }
  };

  const handleDeactivate = async (prop: Property) => {
    const newStatus = prop.status === "active" ? "inactive" : "active";
    // Prevent reactivation if at membership limit
    if (newStatus === "active" && !canCreate("properties")) {
      toast.error(`Your ${membership} membership does not allow more active properties. Please upgrade your membership.`);
      return;
    }
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", prop.id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Property ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchProperties();
      refreshLimits();
    }
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

  return (
    <CompanyLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Properties Management</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search By Title Or ID" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Sort By</span>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
            <SelectTrigger className="w-[190px] bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Newest</SelectItem>
              <SelectItem value="premium_first">Premium First</SelectItem>
              <SelectItem value="featured_first">Featured First</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="h-4 w-4" /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary-foreground text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">{activeFilterCount}</span>
          )}
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete ({selected.length})
            </Button>
          )}
          <Button onClick={() => navigate("/company/properties/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create New Property
          </Button>
        </div>
      </div>

      {/* Classification quick-filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([
          { key: "all", label: "All Properties" },
          { key: "residential_buy", label: "Residential For Sale" },
          { key: "residential_rent", label: "Residential For Rent" },
          { key: "commercial_buy", label: "Commercial For Sale" },
          { key: "commercial_rent", label: "Commercial For Rent" },
        ] as { key: ClassificationFilter; label: string }[]).map((chip) => (
          <button
            key={chip.key}
            onClick={() => setClassificationFilter(chip.key)}
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
            <h3 className="text-sm font-semibold text-foreground">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Property Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {propertyTypes.map((t) => (<SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rooms</label>
              <Select value={filterRooms} onValueChange={setFilterRooms}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All Rooms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {roomOptions.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Furniture</label>
              <Select value={filterFurniture} onValueChange={setFilterFurniture}>
                <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {furnitureOptions.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
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
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">Properties</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} result(s)</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-10"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Creation Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Property Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Contract Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Tier</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Location</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Homepage</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={12} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-12 text-muted-foreground">No properties found.</TableCell></TableRow>
              ) : (
                filtered.map((prop) => (
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
                        <Badge className="bg-purple-100 text-purple-800 gap-1" variant="secondary">
                          <Crown className="h-3 w-3" /> Premium
                        </Badge>
                      ) : prop.property_classification === "featured" ? (
                        <Badge className="bg-teal-100 text-teal-800 gap-1" variant="secondary">
                          <Star className="h-3 w-3" /> Featured
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Standard</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate">{prop.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{prop.location || "—"}</TableCell>
                    <TableCell>
                      {prop.display_on_homepage ? (
                        <Badge className="bg-amber-100 text-amber-800 gap-1" variant="secondary">
                          <Home className="h-3 w-3" /> Featured
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(prop.status)} variant="secondary">
                        {prop.status === "draft" ? "Unpublished" : prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/property/${prop.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fetchProperties()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/company/properties/${prop.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivate(prop)}>
                            <Ban className="h-4 w-4 mr-2" /> {prop.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setAssignDialog({ open: true, property: prop })}>
                            <UserPlus className="h-4 w-4 mr-2" /> Assign To Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setUpgradeDialog({ open: true, property: prop })}>
                            <ArrowUpCircle className="h-4 w-4 mr-2" /> Upgrade To Premium/Featured
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

      {/* Dialogs */}
      {upgradeDialog.property && companyId && (
        <UpgradeListingDialog
          open={upgradeDialog.open}
          onOpenChange={(open) => setUpgradeDialog({ open, property: open ? upgradeDialog.property : null })}
          listingId={upgradeDialog.property.id}
          listingTitle={upgradeDialog.property.title}
          listingType="property"
          companyId={companyId}
          currentClassification={upgradeDialog.property.property_classification}
          onUpgraded={fetchProperties}
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
          onAssigned={fetchProperties}
        />
      )}
    </CompanyLayout>
  );
};

export default CompanyPropertiesPage;

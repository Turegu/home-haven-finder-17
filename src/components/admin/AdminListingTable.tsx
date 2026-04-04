import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Search, MoreVertical, Eye, RefreshCw, Ban, Monitor, Trash2,
  ChevronLeft, ChevronRight, Home, CheckCircle, XCircle, LayoutList,
  Briefcase, Zap, Star, Crown, MapPin,
} from "lucide-react";

export interface ListingItem {
  id: string;
  listing_id: string;
  title: string;
  status: string;
  display_on_homepage: boolean;
  created_at: string;
  updated_at?: string;
  company_name?: string;
  company_membership?: string;
  location?: string;
  province?: string;
  town?: string;
  property_status?: string;
  property_purpose?: string;
  property_type?: string;
  project_status?: string;
  project_type?: string;
  event_type?: string;
  [key: string]: unknown;
}

interface AdminListingTableProps {
  tableName: "properties" | "projects" | "events";
  queryKey: string;
  items: ListingItem[];
  columns: { key: string; label: string }[];
  renderCell: (item: ListingItem, key: string) => React.ReactNode;
  onView?: (item: ListingItem) => void;
  initialCompanyFilter?: string;
}

const ITEMS_PER_PAGE = 10;

const MEMBERSHIP_ICONS: Record<string, React.ReactNode> = {
  basic: <Briefcase className="h-3 w-3" />,
  lite: <Zap className="h-3 w-3" />,
  plus: <Star className="h-3 w-3" />,
  pro: <Crown className="h-3 w-3" />,
};

const MEMBERSHIP_COLORS: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  lite: "bg-purple-100 text-purple-800",
  plus: "bg-orange-100 text-orange-800",
  pro: "bg-emerald-100 text-emerald-800",
};

const AdminListingTable = ({
  tableName, queryKey, items, columns, renderCell, onView, initialCompanyFilter,
}: AdminListingTableProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all");
  const [companyFilter, setCompanyFilter] = useState<string>(initialCompanyFilter || "all");

  // Unique companies for dropdown
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.company_name && item.company_name !== "—") {
        map.set(item.company_name, item.company_name);
      }
    });
    return Array.from(map.values()).sort();
  }, [items]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === "active").length,
    deactivated: items.filter((i) => i.status === "deactivated").length,
  }), [items]);

  // Filter & sort
  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = !search ||
          turkishIncludes(item.title, search) ||
          turkishIncludes(item.listing_id, search) ||
          turkishIncludes(item.company_name || "", search);
        const matchesLocation = !locationSearch ||
          turkishIncludes(item.province || "", locationSearch) ||
          turkishIncludes(item.town || "", locationSearch) ||
          turkishIncludes(item.location || "", locationSearch);
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesCompany = companyFilter === "all" || item.company_name === companyFilter;
        return matchesSearch && matchesLocation && matchesStatus && matchesCompany;
      })
      .sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sortOrder === "newest" ? db - da : da - db;
      });
  }, [items, search, locationSearch, statusFilter, companyFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from(tableName).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Updated successfully");
    },
    onError: () => toast.error("Update failed"),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase.from(tableName).update(updates).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setSelectedIds(new Set());
      toast.success("Bulk update successful");
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from(tableName).delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setSelectedIds(new Set());
      toast.success("Deleted successfully");
    },
    onError: () => toast.error("Delete failed"),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((i) => i.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} listing(s)? This cannot be undone.`)) {
      deleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({
      ids: Array.from(selectedIds),
      updates: { status: newStatus },
    });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      deactivated: "bg-red-100 text-red-800",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || "bg-muted text-muted-foreground"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const membershipBadge = (membership?: string) => {
    if (!membership) return null;
    const color = MEMBERSHIP_COLORS[membership] || MEMBERSHIP_COLORS.basic;
    const icon = MEMBERSHIP_ICONS[membership] || MEMBERSHIP_ICONS.basic;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${color}`}>
        {icon} {membership.charAt(0).toUpperCase() + membership.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-primary/10 p-2">
            <LayoutList className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.total")}</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.active")}</p>
            <p className="text-lg font-bold text-green-700">{stats.active}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-full bg-red-100 p-2">
            <XCircle className="h-4 w-4 text-red-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.deactivated")}</p>
            <p className="text-lg font-bold text-red-700">{stats.deactivated}</p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["all", "active", "deactivated"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatusFilter(tab); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "all" ? `All (${stats.total})` : tab === "active" ? `Active (${stats.active})` : `Deactivated (${stats.deactivated})`}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.searchByTitleIdCompany")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 w-60"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.searchByLocation")}
              value={locationSearch}
              onChange={(e) => { setLocationSearch(e.target.value); setPage(1); }}
              className="pl-9 w-56"
            />
          </div>
          <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Sort</span>
            <Select value={sortOrder} onValueChange={(v) => { setSortOrder(v as typeof sortOrder); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest to Old</SelectItem>
                <SelectItem value="oldest">Oldest to New</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("active")}>
              <CheckCircle className="h-4 w-4 mr-1" /> Activate ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("deactivated")}>
              <Ban className="h-4 w-4 mr-1" /> Deactivate ({selectedIds.size})
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {paginated.length} of {filtered.length} listing(s)
      </p>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary/10">
              <th className="p-3 text-left w-10">
                <Checkbox
                  checked={paginated.length > 0 && selectedIds.size === paginated.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-3 text-left font-semibold text-foreground w-12">#</th>
              {columns.map((col) => (
                <th key={col.key} className="p-3 text-left font-semibold text-foreground whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="p-3 text-center font-semibold text-foreground">STATUS</th>
              <th className="p-3 text-center font-semibold text-foreground">OPTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="p-8 text-center text-muted-foreground">
                  No listings found
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground text-xs font-medium">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-foreground">
                      <span className="flex items-center gap-1.5">
                        {renderCell(item, col.key)}
                        {col.key === "title" && item.display_on_homepage && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0" title="Displayed on Homepage">
                            <Home className="h-3 w-3" /> Homepage
                          </span>
                        )}
                        {col.key === "company_name" && item.company_membership && (
                          <span className="ml-1">{membershipBadge(item.company_membership)}</span>
                        )}
                      </span>
                    </td>
                  ))}
                  <td className="p-3 text-center">{statusBadge(item.status)}</td>
                  <td className="p-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(item)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => queryClient.invalidateQueries({ queryKey: [queryKey] })}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateMutation.mutate({
                              id: item.id,
                              updates: { status: item.status === "active" ? "deactivated" : "active" },
                            })
                          }
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {item.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateMutation.mutate({
                              id: item.id,
                              updates: { display_on_homepage: !item.display_on_homepage },
                            })
                          }
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          {item.display_on_homepage ? "Remove from Homepage" : "Display on Homepage"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this listing?")) deleteMutation.mutate([item.id]);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="sm"
              onClick={() => setPage(p)}
              className="w-8 h-8"
            >
              {p}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminListingTable;

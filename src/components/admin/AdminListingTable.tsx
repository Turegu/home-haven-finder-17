import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, MoreVertical, Eye, RefreshCw, Ban, Monitor, Trash2, ChevronLeft, ChevronRight, Home,
} from "lucide-react";

export interface ListingItem {
  id: string;
  listing_id: string;
  title: string;
  status: string;
  display_on_homepage: boolean;
  created_at: string;
  company_name?: string;
  location?: string;
  // type-specific
  property_status?: string;
  property_purpose?: string;
  property_type?: string;
  project_status?: string;
  project_type?: string;
  event_type?: string;
}

interface AdminListingTableProps {
  tableName: "properties" | "projects" | "events";
  queryKey: string;
  items: ListingItem[];
  columns: { key: string; label: string }[];
  renderCell: (item: ListingItem, key: string) => React.ReactNode;
  onView?: (item: ListingItem) => void;
}

const ITEMS_PER_PAGE = 10;

const AdminListingTable = ({
  tableName, queryKey, items, columns, renderCell, onView,
}: AdminListingTableProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Filter & sort
  const filtered = items
    .filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.listing_id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search By Title Or ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Sort By Date</span>
            <Select value={sortOrder} onValueChange={(v) => { setSortOrder(v as any); setPage(1); }}>
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
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedIds.size})
          </Button>
        )}
      </div>

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
              paginated.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-foreground">
                      <span className="flex items-center gap-1.5">
                        {renderCell(item, col.key)}
                        {col.key === "title" && item.display_on_homepage && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0" title="Displayed on Homepage">
                            <Home className="h-3 w-3" /> Homepage
                          </span>
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

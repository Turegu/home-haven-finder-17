import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Search, Plus, Trash2, MoreVertical, Eye, Pencil, Ban, LayoutList, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";

interface EventRow {
  id: string;
  listing_id: string;
  title: string;
  event_type: string;
  location: string | null;
  status: string;
  created_at: string;
  entry_type: string;
  agent_name: string | null;
}

const ITEMS_PER_PAGE = 10;

const CompanyEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [filterEntry, setFilterEntry] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { canCreate, membership, usage, limits, remainingSlots, refresh: refreshLimits } = useMembershipLimits(companyId);

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

  const fetchEvents = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id, listing_id, title, event_type, location, status, created_at, entry_type, agent_id, agents(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: sortOrder === "oldest" });
    if (error) toast.error("Failed to fetch events");
    else setEvents((data || []).map((e: any) => ({ ...e, agent_name: e.agents?.name || null })) as EventRow[]);
    setLoading(false);
  };

  useEffect(() => { if (companyId) fetchEvents(); }, [companyId, sortOrder]);

  const stats = useMemo(() => ({
    total: events.length,
    active: events.filter(e => e.status === "active").length,
    inactive: events.filter(e => e.status === "inactive").length,
    draft: events.filter(e => e.status === "draft").length,
  }), [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.listing_id.includes(search)) return false;
    if (filterType !== "all" && e.event_type !== filterType) return false;
    if (filterEntry !== "all" && e.entry_type !== filterEntry) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  }), [events, search, filterType, filterEntry, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const eventTypes = [...new Set(events.map(e => e.event_type))];
  const entryTypes = [...new Set(events.map(e => e.entry_type))];

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const toggleAll = () => {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map((e) => e.id));
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    const { error } = await supabase.from("events").delete().in("id", selected);
    if (error) toast.error("Delete failed");
    else { toast.success(`${selected.length} event(s) deleted`); setSelected([]); fetchEvents(); refreshLimits(); }
  };

  const handleDeactivate = async (evt: EventRow) => {
    const newStatus = evt.status === "active" ? "inactive" : "active";
    if (newStatus === "active" && !canCreate("events")) {
      toast.error(`Your ${membership} membership does not allow more active events. Please upgrade.`);
      return;
    }
    const { error } = await supabase.from("events").update({ status: newStatus }).eq("id", evt.id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Event ${newStatus === "active" ? "activated" : "deactivated"}`); fetchEvents(); refreshLimits(); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-emerald-100 text-emerald-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "draft": return "bg-amber-100 text-amber-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const maxEvents = limits?.max_events || 1;
  const usagePercent = Math.min(100, (usage.events / maxEvents) * 100);

  return (
    <CompanyLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Events Management</h1>
      </div>

      {/* Membership Usage */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Events Used: {usage.events} / {maxEvents} ({membership.charAt(0).toUpperCase() + membership.slice(1)})</span>
            <span className="text-xs text-muted-foreground">{remainingSlots("events")} remaining</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>
      </div>

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

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search By Name Or ID" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-secondary/50" />
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
          <Button onClick={() => {
            if (!canCreate("events")) { toast.error(`Your ${membership} membership does not allow more events. Please upgrade.`); return; }
            navigate("/company/events/new");
          }}>
            <Plus className="h-4 w-4 mr-2" /> Create New Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
              <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map((t) => (<SelectItem key={t} value={t}>{formatType(t)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Entry Type</label>
            <Select value={filterEntry} onValueChange={(v) => { setFilterEntry(v); setPage(1); }}>
              <SelectTrigger className="bg-secondary/50 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {entryTypes.map((t) => (<SelectItem key={t} value={t}>{formatType(t)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
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

      <p className="text-xs text-muted-foreground mb-2">Showing {paginated.length} of {filtered.length} event(s)</p>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-10"><Checkbox checked={paginated.length > 0 && selected.length === paginated.length} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Creation Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Assigned Agent</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Location</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No events found.</TableCell></TableRow>
              ) : (
                paginated.map((evt) => (
                  <TableRow key={evt.id} className="hover:bg-muted/30">
                    <TableCell><Checkbox checked={selected.includes(evt.id)} onCheckedChange={() => toggleSelect(evt.id)} /></TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{evt.listing_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(evt.created_at), "dd/MM/yyyy hh:mm a")}</TableCell>
                    <TableCell className="text-sm capitalize">{formatType(evt.event_type)}</TableCell>
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate">{evt.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{evt.agent_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{evt.location || "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(evt.status)} variant="secondary">
                        {evt.status === "draft" ? "Unpublished" : evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/events/${evt.id}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/company/events/${evt.id}/edit`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivate(evt)}><Ban className="h-4 w-4 mr-2" /> {evt.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "ghost"} size="sm" onClick={() => setPage(p)} className="w-8 h-8">{p}</Button>
          ))}
          <Button variant="ghost" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </CompanyLayout>
  );
};

export default CompanyEventsPage;

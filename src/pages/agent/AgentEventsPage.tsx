import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Eye, Pencil, MoreVertical, LayoutList, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const AgentEventsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterType, setFilterType] = useState("all");
  const [filterEntry, setFilterEntry] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("id, company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!agent) return;
      const { data, error } = await supabase
        .from("events")
        .select("id, listing_id, title, event_type, entry_type, status, event_date, created_at")
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: sortOrder === "oldest" });
      if (error) toast.error("Failed to load");
      else setEvents(data || []);
      setLoading(false);
    };
    fetch();
  }, [sortOrder]);

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const eventTypes = [...new Set(events.map(e => e.event_type))];
  const entryTypes = [...new Set(events.map(e => e.entry_type))];

  const stats = useMemo(() => ({
    total: events.length,
    active: events.filter(e => e.status === "active").length,
    inactive: events.filter(e => e.status === "inactive").length,
    draft: events.filter(e => e.status === "draft").length,
  }), [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (search && !turkishIncludes(e.title || '', search) && !e.listing_id?.includes(search)) return false;
    if (filterType !== "all" && e.event_type !== filterType) return false;
    if (filterEntry !== "all" && e.entry_type !== filterEntry) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  }), [events, search, filterType, filterEntry, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("agentDashboard.myEvents")}</h1>

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
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
          <SelectTrigger className="w-[170px] bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
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
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Entry</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Event Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No events assigned to you.</TableCell></TableRow>
            ) : paginated.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{e.listing_id}</TableCell>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell className="capitalize text-sm">{formatType(e.event_type)}</TableCell>
                <TableCell className="capitalize text-sm">{formatType(e.entry_type)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.event_date ? format(new Date(e.event_date), "dd MMM yyyy") : "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={e.status === "active" ? "bg-emerald-100 text-emerald-800" : e.status === "draft" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}>
                    {e.status === "draft" ? "Unpublished" : e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/events/${e.id}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/company/events/${e.id}/edit`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
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
    </AgentLayout>
  );
};

export default AgentEventsPage;

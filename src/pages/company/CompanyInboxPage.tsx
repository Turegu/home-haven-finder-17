import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { turkishIncludes } from "@/lib/utils";
import { INBOX_TYPES, type InboxType } from "@/constants/inbox";
import { inboxService } from "@/services/inbox.service";
import { useCompanyId } from "@/hooks/useCompanyId";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import InboxMessageDialog from "@/components/company/InboxMessageDialog";
import { Search, Trash2, Eye, Mail, MessageSquare, Home, Lock, ExternalLink, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface ListingMeta {
  title: string;
  listing_id?: string;
  images?: string[] | null;
  price?: number | null;
  currency?: string | null;
  location?: string | null;
}

interface InboxItem {
  id: string;
  inbox_type: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  budget: string | null;
  property_id: string | null;
  project_id: string | null;
  is_seen: boolean;
  created_at: string;
  listing_meta?: ListingMeta | null;
}

type InboxTab = InboxType;

const getListingLink = (item: InboxItem) => {
  if (item.property_id) return `/property/${item.property_id}`;
  if (item.project_id) return `/projects/${item.project_id}`;
  return null;
};

const getListingTitle = (item: InboxItem) => item.listing_meta?.title || null;

const formatPrice = (price: number, currency?: string | null) => {
  if (currency === 'USD') return `$ ${price.toLocaleString()}`;
  if (currency === 'EUR') return `€ ${price.toLocaleString()}`;
  if (currency === 'TRY') return `₺ ${price.toLocaleString()}`;
  return `${currency || ''} ${price.toLocaleString()}`;
};

const ListingCard = ({ item }: { item: InboxItem }) => {
  const meta = item.listing_meta;
  if (!meta) return null;
  const link = getListingLink(item);
  if (!link) return null;
  const image = meta.images?.[0];

  return (
    <Link to={link} className="block border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        {image && (
          <img src={image} alt={meta.title} className="w-24 h-20 rounded-md object-cover flex-shrink-0 bg-muted" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{meta.title}</p>
          {meta.listing_id && (
            <p className="text-xs text-muted-foreground">Ref: {meta.listing_id}</p>
          )}
          {meta.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> <span className="truncate">{meta.location}</span>
            </p>
          )}
          {meta.price != null && meta.price > 0 && (
            <p className="text-xs font-medium text-primary flex items-center gap-1 mt-0.5">
              <DollarSign className="h-3 w-3" /> {formatPrice(meta.price, meta.currency)}
            </p>
          )}
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
};

const CompanyInboxPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: companyData } = useCompanyId();
  const companyId = companyData?.id || null;
  const companyName = companyData?.name || "";

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<InboxTab>(INBOX_TYPES.INQUIRY);
  const [viewItem, setViewItem] = useState<InboxItem | null>(null);
  const { data: hasPropertyRequests } = useQuery({
    queryKey: ["has-property-requests", companyData?.membership],
    queryFn: async () => {
      const { data: pkg } = await supabase
        .from("membership_packages")
        .select("has_property_requests")
        .eq("package_type", companyData!.membership)
        .maybeSingle();
      return pkg?.has_property_requests ?? false;
    },
    enabled: !!companyData?.membership,
    staleTime: 5 * 60 * 1000,
  });

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["company-inbox", companyId, activeTab],
    queryFn: async () => {
      const { data, error } = await inboxService.getByCompany(companyId!, activeTab);
      if (error) { toast.error("Failed to load inbox"); return []; }

      const rows = (data || []) as InboxItem[];
      const propertyIds = Array.from(new Set(rows.map((r) => r.property_id).filter(Boolean))) as string[];
      const projectIds = Array.from(new Set(rows.map((r) => r.project_id).filter(Boolean))) as string[];

      const [propertiesRes, projectsRes] = await Promise.all([
        propertyIds.length > 0
          ? supabase.from("properties").select("id, title, listing_id, images, price, currency, location").in("id", propertyIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        projectIds.length > 0
          ? supabase.from("projects").select("id, title, listing_id, images, min_price, currency, location").in("id", projectIds)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);

      const propertyMap = new Map<string, ListingMeta>(
        ((propertiesRes.data || []) as any[]).map((p) => [p.id, {
          title: p.title, listing_id: p.listing_id, images: p.images,
          price: p.price, currency: p.currency, location: p.location,
        }])
      );

      const projectMap = new Map<string, ListingMeta>(
        ((projectsRes.data || []) as any[]).map((p) => [p.id, {
          title: p.title, listing_id: p.listing_id, images: p.images,
          price: p.min_price, currency: p.currency, location: p.location,
        }])
      );

      return rows.map((row) => ({
        ...row,
        listing_meta: row.property_id
          ? propertyMap.get(row.property_id) || null
          : row.project_id
          ? projectMap.get(row.project_id) || null
          : null,
      }));
    },
    enabled: !!companyId,
    staleTime: 0,
  });

  // Realtime subscription for new inbox items
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`company-inbox-${companyId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "company_inbox",
        filter: `company_id=eq.${companyId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["company-inbox", companyId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  const filtered = items.filter(
    (item) => turkishIncludes(item.full_name, search) || turkishIncludes(item.email, search)
  );


  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((i) => i.id));
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await inboxService.deleteMany(ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} item(s) deleted`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["company-inbox", companyId] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleDelete = () => {
    if (selected.length === 0) return;
    deleteMutation.mutate(selected);
  };

  const handleView = async (item: InboxItem) => {
    setViewItem(item);
    if (!item.is_seen) {
      await inboxService.markSeen(item.id);
      queryClient.invalidateQueries({ queryKey: ["company-inbox", companyId] });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as InboxTab);
    setSelected([]);
  };

  const renderInboxTable = (tab: string) => {
    const colCount = 8 + (tab === "property_request" ? 1 : 0);

    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div ref={parentRef} style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-10">
                  <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.sno")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.fullName")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.email")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Property / العقار</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.phoneNo")}</TableHead>
                {tab === "property_request" && (
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.budget")}</TableHead>
                )}
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.isSeen")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">{t("companyDashboard.options")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">{t("common.loading")}</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">{t("companyDashboard.noDataFound")}</TableCell>
                </TableRow>
              ) : (
                <>
                  <tr style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                    <td colSpan={colCount} style={{ padding: 0, position: 'relative', height: virtualizer.getTotalSize() }}>
                      {virtualizer.getVirtualItems().map((virtualRow) => {
                        const item = filtered[virtualRow.index];
                        const title = getListingTitle(item);
                        const link = getListingLink(item);
                        return (
                          <TableRow key={item.id} className={`hover:bg-muted/30 ${!item.is_seen ? "bg-primary/5" : ""}`} style={{ position: 'absolute', top: virtualRow.start, width: '100%', display: 'table-row' }}>
                            <TableCell><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{virtualRow.index + 1}</TableCell>
                            <TableCell className="font-medium text-foreground">{item.full_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                            <TableCell className="text-sm">
                              {title && link ? (
                                <Link to={link} className="text-primary hover:underline flex items-center gap-1 max-w-[220px]">
                                  <span className="truncate">{title}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.phone || "—"}</TableCell>
                            {tab === "property_request" && (
                              <TableCell className="text-sm font-medium text-foreground">{item.budget ? item.budget.trim() : "—"}</TableCell>
                            )}
                            <TableCell>
                              <Badge
                                className={item.is_seen ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}
                                variant="secondary"
                              >
                                {item.is_seen ? t("companyDashboard.seen") : t("companyDashboard.unseen")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </td>
                  </tr>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("companyDashboard.inbox")}</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value={INBOX_TYPES.INQUIRY} className="gap-2">
            <MessageSquare className="h-4 w-4" /> {t("companyDashboard.inquiry")}
          </TabsTrigger>
          <TabsTrigger value={INBOX_TYPES.MESSAGE} className="gap-2">
            <Mail className="h-4 w-4" /> {t("companyDashboard.message")}
          </TabsTrigger>
          <TabsTrigger value={INBOX_TYPES.PROPERTY_REQUEST} className="gap-2">
            <Home className="h-4 w-4" /> {t("companyDashboard.propertyRequests")}
            {hasPropertyRequests === false && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={INBOX_TYPES.INQUIRY}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("companyDashboard.searchByName")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
            </div>
            {selected.length > 0 && (
              <Button variant="destructive" onClick={handleDelete} className="ml-auto">
                <Trash2 className="h-4 w-4 mr-2" /> {t("companyDashboard.delete")} ({selected.length})
              </Button>
            )}
          </div>
          {renderInboxTable(INBOX_TYPES.INQUIRY)}
        </TabsContent>

        <TabsContent value={INBOX_TYPES.MESSAGE}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("companyDashboard.searchByName")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
            </div>
            {selected.length > 0 && (
              <Button variant="destructive" onClick={handleDelete} className="ml-auto">
                <Trash2 className="h-4 w-4 mr-2" /> {t("companyDashboard.delete")} ({selected.length})
              </Button>
            )}
          </div>
          {renderInboxTable(INBOX_TYPES.MESSAGE)}
        </TabsContent>

        <TabsContent value={INBOX_TYPES.PROPERTY_REQUEST}>
          {hasPropertyRequests === false ? (
            <div className="bg-muted/50 border border-border rounded-xl p-8 text-center">
              <Lock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">{t("companyDashboard.propertyRequestsLocked")}</p>
              <p className="text-xs text-muted-foreground">{t("companyDashboard.propertyRequestsUpgrade")}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("companyDashboard.searchByName")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
                </div>
                {selected.length > 0 && (
                  <Button variant="destructive" onClick={handleDelete} className="ml-auto">
                    <Trash2 className="h-4 w-4 mr-2" /> {t("companyDashboard.delete")} ({selected.length})
                  </Button>
                )}
              </div>
              {renderInboxTable(INBOX_TYPES.PROPERTY_REQUEST)}
            </>
          )}
        </TabsContent>
      </Tabs>

      <InboxMessageDialog
        item={viewItem}
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
        companyName={companyName}
      />
    </CompanyLayout>
  );
};

export default CompanyInboxPage;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { turkishIncludes } from "@/lib/utils";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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

type InboxTab = "property_request" | "inquiry" | "message";

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
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<InboxTab>("inquiry");
  const [viewItem, setViewItem] = useState<InboxItem | null>(null);
  const [hasPropertyRequests, setHasPropertyRequests] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies")
        .select("id, name, membership")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (company) {
        setCompanyId(company.id);
        setCompanyName(company.name || "");
        const { data: pkg } = await supabase
          .from("membership_packages")
          .select("has_property_requests")
          .eq("package_type", company.membership)
          .maybeSingle();
        setHasPropertyRequests(pkg?.has_property_requests ?? false);
      }
    };

    init();
  }, []);

  const fetchItems = async () => {
    if (!companyId) return;
    setLoading(true);

    const { data: inboxRows, error } = await supabase
      .from("company_inbox")
      .select("*")
      .eq("company_id", companyId)
      .eq("inbox_type", activeTab)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load inbox");
      setLoading(false);
      return;
    }

    const rows = (inboxRows || []) as InboxItem[];
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
        title: p.title,
        listing_id: p.listing_id,
        images: p.images,
        price: p.price,
        currency: p.currency,
        location: p.location,
      }])
    );
    const projectMap = new Map<string, ListingMeta>(
      ((projectsRes.data || []) as any[]).map((p) => [p.id, {
        title: p.title,
        listing_id: p.listing_id,
        images: p.images,
        price: p.min_price,
        currency: p.currency,
        location: p.location,
      }])
    );

    const mapped = rows.map((row) => ({
      ...row,
      listing_meta: row.property_id
        ? propertyMap.get(row.property_id) || null
        : row.project_id
        ? projectMap.get(row.project_id) || null
        : null,
    }));

    setItems(mapped);
    setSelected([]);
    setLoading(false);
  };

  useEffect(() => { if (companyId) fetchItems(); }, [companyId, activeTab]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel("company-inbox")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "company_inbox",
        filter: `company_id=eq.${companyId}`,
      }, (payload) => {
        const newItem = payload.new as InboxItem;
        if (newItem.inbox_type === activeTab) {
          setItems((prev) => [{ ...newItem, listing_meta: null }, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, activeTab]);

  const filtered = items.filter(
    (item) => turkishIncludes(item.full_name, search) || turkishIncludes(item.email, search)
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((i) => i.id));
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    const { error } = await supabase.from("company_inbox").delete().in("id", selected);
    if (error) toast.error("Delete failed");
    else {
      toast.success(`${selected.length} item(s) deleted`);
      setSelected([]);
      fetchItems();
    }
  };

  const handleView = async (item: InboxItem) => {
    setViewItem(item);
    if (!item.is_seen) {
      await supabase.from("company_inbox").update({ is_seen: true }).eq("id", item.id);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_seen: true } : i));
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "property_request" || value === "inquiry" || value === "message") {
      setActiveTab(value);
    }
  };

  const renderInboxTable = (tab: string) => {
    const colCount = 8 + (tab === "property_request" ? 1 : 0);

    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
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
                filtered.map((item, idx) => {
                  const title = getListingTitle(item);
                  const link = getListingLink(item);
                  return (
                    <TableRow key={item.id} className={`hover:bg-muted/30 ${!item.is_seen ? "bg-primary/5" : ""}`}>
                      <TableCell><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
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
                        <TableCell className="text-sm font-medium text-foreground">{item.budget ? `$${item.budget}` : "—"}</TableCell>
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
                })
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
          <TabsTrigger value="inquiry" className="gap-2" onClick={() => setActiveTab("inquiry")}>
            <MessageSquare className="h-4 w-4" /> {t("companyDashboard.inquiry")}
          </TabsTrigger>
          <TabsTrigger value="message" className="gap-2" onClick={() => setActiveTab("message")}>
            <Mail className="h-4 w-4" /> {t("companyDashboard.message")}
          </TabsTrigger>
          <TabsTrigger value="property_request" className="gap-2" onClick={() => setActiveTab("property_request")}>
            <Home className="h-4 w-4" /> {t("companyDashboard.propertyRequests")}
            {hasPropertyRequests === false && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inquiry">
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
          {renderInboxTable("inquiry")}
        </TabsContent>

        <TabsContent value="message">
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
          {renderInboxTable("message")}
        </TabsContent>

        <TabsContent value="property_request">
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
              {renderInboxTable("property_request")}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewItem?.inbox_type === "property_request" ? t("companyDashboard.propertyRequests") :
               viewItem?.inbox_type === "inquiry" ? t("companyDashboard.inquiry") : t("companyDashboard.message")} - {t("companyDashboard.requestDetails")}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("companyDashboard.fullName")}</p>
                  <p className="text-sm font-medium text-foreground">{viewItem.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("companyDashboard.email")}</p>
                  <p className="text-sm font-medium text-foreground">{viewItem.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("companyDashboard.phone")}</p>
                  <p className="text-sm font-medium text-foreground">{viewItem.phone || "—"}</p>
                </div>
                {viewItem.budget && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("companyDashboard.budget")}</p>
                    <p className="text-sm font-medium text-foreground">${viewItem.budget}</p>
                  </div>
                )}
              </div>

              {/* Listing card */}
              <ListingCard item={viewItem} />

              {viewItem.message && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("companyDashboard.message")}</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-3 whitespace-pre-wrap">{viewItem.message}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("companyDashboard.received")}: {format(new Date(viewItem.created_at), "do MMM yyyy hh:mm a")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CompanyLayout>
  );
};

export default CompanyInboxPage;

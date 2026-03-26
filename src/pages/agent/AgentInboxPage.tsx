import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { turkishIncludes } from "@/lib/utils";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import InboxMessageDialog from "@/components/company/InboxMessageDialog";
import { Search, Eye, Mail, MessageSquare, Home, Lock, ExternalLink, MapPin, DollarSign } from "lucide-react";
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

const AgentInboxPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("inquiry");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<InboxItem | null>(null);
  const [hasPropertyRequests, setHasPropertyRequests] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("id, company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (agent) {
        setCompanyId(agent.company_id);
        setAgentId(agent.id);

        const { data: company } = await supabase.from("companies").select("name, membership").eq("id", agent.company_id).maybeSingle();
        if (company) {
          setCompanyName(company.name || "");
          const { data: pkg } = await supabase.from("membership_packages").select("has_property_requests").eq("package_type", company.membership).maybeSingle();
          setHasPropertyRequests(pkg?.has_property_requests ?? false);
        }
      }
    };
    init();
  }, []);

  const fetchItems = async () => {
    if (!companyId || !agentId) return;
    setLoading(true);
    const { data } = await supabase
      .from("company_inbox")
      .select("*, properties(title, listing_id, images, price, currency, location), projects(title, listing_id, images, min_price, currency, location)")
      .eq("company_id", companyId)
      .eq("agent_id", agentId)
      .eq("inbox_type", tab)
      .order("created_at", { ascending: false });
    const mapped = (data || []).map((row: any) => ({
      ...row,
      listing_meta: row.properties
        ? { title: row.properties.title, listing_id: row.properties.listing_id, images: row.properties.images, price: row.properties.price, currency: row.properties.currency, location: row.properties.location }
        : row.projects
        ? { title: row.projects.title, listing_id: row.projects.listing_id, images: row.projects.images, price: row.projects.min_price, currency: row.projects.currency, location: row.projects.location }
        : null,
    }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => { if (companyId && agentId) fetchItems(); }, [companyId, agentId, tab]);

  const filtered = items.filter(
    (i) => turkishIncludes(i.full_name, search) || turkishIncludes(i.email, search)
  );

  const handleView = async (item: InboxItem) => {
    setViewItem(item);
    if (!item.is_seen) {
      await supabase.from("company_inbox").update({ is_seen: true }).eq("id", item.id);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_seen: true } : i));
    }
  };

  const renderTable = (currentTab: string) => {
    const showListingCol = currentTab === "inquiry";
    const colCount = 5 + (showListingCol ? 1 : 0);

    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.fullName")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.email")}</TableHead>
              {showListingCol && (
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.listing", "Listing")}</TableHead>
              )}
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.creationDate")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.status")}</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">{t("companyDashboard.view")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={colCount} className="text-center py-12">
                <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground">{t("companyDashboard.noDataFound")}</p>
              </TableCell></TableRow>
            ) : filtered.map((item) => {
              const title = getListingTitle(item);
              const link = getListingLink(item);
              return (
                <TableRow key={item.id} className={`hover:bg-muted/30 ${!item.is_seen ? "bg-primary/5" : ""}`}>
                  <TableCell className="font-medium">{item.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                  {showListingCol && (
                    <TableCell className="text-sm">
                      {title && link ? (
                        <Link to={link} className="text-primary hover:underline flex items-center gap-1 max-w-[180px]">
                          <span className="truncate">{title}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("companyDashboard.profileMessage", "Profile message")}</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(item.created_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell><Badge variant="secondary" className={item.is_seen ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}>{item.is_seen ? t("companyDashboard.seen") : t("companyDashboard.new")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("agentDashboard.inbox")}</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inquiry" className="gap-2">
            <MessageSquare className="h-4 w-4" /> {t("companyDashboard.inquiry")}
          </TabsTrigger>
          <TabsTrigger value="message" className="gap-2">
            <Mail className="h-4 w-4" /> {t("companyDashboard.message")}
          </TabsTrigger>
          <TabsTrigger value="property_request" className="gap-2">
            <Home className="h-4 w-4" /> {t("companyDashboard.propertyRequests")}
            {hasPropertyRequests === false && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("companyDashboard.searchByName")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
          </div>
        </div>

        <TabsContent value="inquiry">
          {renderTable("inquiry")}
        </TabsContent>

        <TabsContent value="message">
          {renderTable("message")}
        </TabsContent>

        <TabsContent value="property_request">
          {hasPropertyRequests === false ? (
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">{t("companyDashboard.propertyRequestsLocked")}</p>
              <p className="text-xs text-muted-foreground">{t("companyDashboard.propertyRequestsUpgrade")}</p>
            </div>
          ) : (
            renderTable("property_request")
          )}
        </TabsContent>
      </Tabs>

      <InboxMessageDialog
        item={viewItem}
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
        companyName={companyName}
      />
    </AgentLayout>
  );
};

export default AgentInboxPage;

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Mail, MessageSquare, Home, Lock } from "lucide-react";
import { format } from "date-fns";

const AgentInboxPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("inquiry");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [hasPropertyRequests, setHasPropertyRequests] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("id, company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (agent) {
        setCompanyId(agent.company_id);
        setAgentId(agent.id);
        fetchItems(agent.company_id, agent.id);

        // Check membership feature
        const { data: company } = await supabase.from("companies").select("membership").eq("id", agent.company_id).maybeSingle();
        if (company) {
          const { data: pkg } = await supabase.from("membership_packages").select("has_property_requests").eq("package_type", company.membership).maybeSingle();
          setHasPropertyRequests(pkg?.has_property_requests ?? false);
        }
      }
    };
    init();
  }, []);

  const fetchItems = async (cId: string, aId: string) => {
    setLoading(true);
    const { data } = await supabase.from("company_inbox").select("*").eq("company_id", cId).eq("agent_id", aId).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => i.inbox_type === tab && (turkishIncludes(i.full_name, search) || turkishIncludes(i.email, search)));

  const handleView = async (item: any) => {
    setViewItem(item);
    if (!item.is_seen) {
      await supabase.from("company_inbox").update({ is_seen: true }).eq("id", item.id);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_seen: true } : i));
    }
  };

  const showPropertyRequestTab = hasPropertyRequests === true;

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("agentDashboard.inbox")}</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {showPropertyRequestTab && (
            <TabsTrigger value="property_request" className="gap-2">
              <Home className="h-4 w-4" /> {t("companyDashboard.propertyRequests")}
            </TabsTrigger>
          )}
          <TabsTrigger value="inquiry" className="gap-2">
            <MessageSquare className="h-4 w-4" /> {t("companyDashboard.inquiry")}
          </TabsTrigger>
          <TabsTrigger value="message" className="gap-2">
            <Mail className="h-4 w-4" /> {t("companyDashboard.message")}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("companyDashboard.searchByName")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
          </div>
        </div>

        {hasPropertyRequests === false && tab === "property_request" && (
          <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
            <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">{t("companyDashboard.propertyRequestsLocked")}</p>
            <p className="text-xs text-muted-foreground">{t("companyDashboard.propertyRequestsUpgrade")}</p>
          </div>
        )}

        <TabsContent value={tab}>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.fullName")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.email")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.creationDate")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.status")}</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">{t("companyDashboard.view")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                    <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">{t("companyDashboard.noDataFound")}</p>
                  </TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} className={`hover:bg-muted/30 ${!item.is_seen ? "bg-primary/5" : ""}`}>
                    <TableCell className="font-medium">{item.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(item.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell><Badge variant="secondary" className={item.is_seen ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}>{item.is_seen ? t("companyDashboard.seen") : t("companyDashboard.new")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewItem?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p><strong>{t("companyDashboard.email")}:</strong> {viewItem?.email}</p>
            {viewItem?.phone && <p><strong>{t("companyDashboard.phone")}:</strong> {viewItem.phone}</p>}
            {viewItem?.budget && <p><strong>{t("companyDashboard.budget")}:</strong> {viewItem.budget}</p>}
            {viewItem?.message && <div><strong>{t("companyDashboard.message")}:</strong><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{viewItem.message}</p></div>}
            <p className="text-xs text-muted-foreground">{t("companyDashboard.received")}: {viewItem && new Date(viewItem.created_at).toLocaleString()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
};

export default AgentInboxPage;

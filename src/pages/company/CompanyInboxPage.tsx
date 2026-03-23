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
import { Search, Trash2, Eye, Mail, MessageSquare, Home } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
}

const CompanyInboxPage = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("property_request");
  const [viewItem, setViewItem] = useState<InboxItem | null>(null);

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

  const fetchItems = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("company_inbox")
      .select("*")
      .eq("company_id", companyId)
      .eq("inbox_type", activeTab)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load inbox");
    else setItems((data as InboxItem[]) || []);
    setSelected([]);
    setLoading(false);
  };

  useEffect(() => { if (companyId) fetchItems(); }, [companyId, activeTab]);

  // Realtime
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
          setItems((prev) => [newItem, ...prev]);
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
    else { toast.success(`${selected.length} item(s) deleted`); setSelected([]); fetchItems(); }
  };

  const handleView = async (item: InboxItem) => {
    setViewItem(item);
    if (!item.is_seen) {
      await supabase.from("company_inbox").update({ is_seen: true }).eq("id", item.id);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_seen: true } : i));
    }
  };

  const unseenCounts = (type: string) => items.filter((i) => i.inbox_type === type && !i.is_seen).length;

  const tabLabel = (type: string, label: string, icon: React.ReactNode) => (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Inbox</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="property_request" className="gap-2">
            <Home className="h-4 w-4" /> Property Requests
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Inquiry
          </TabsTrigger>
          <TabsTrigger value="message" className="gap-2">
            <Mail className="h-4 w-4" /> Message
          </TabsTrigger>
        </TabsList>

        {["property_request", "inquiry", "message"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search By Name" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
              </div>
              {selected.length > 0 && (
                <Button variant="destructive" onClick={handleDelete} className="ml-auto">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete ({selected.length})
                </Button>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="w-10">
                        <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold">SNO</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold">Full Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold">Email</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold">Phone No.</TableHead>
                      {tab === "property_request" && (
                        <TableHead className="text-xs uppercase tracking-wider font-semibold">Budget</TableHead>
                      )}
                      <TableHead className="text-xs uppercase tracking-wider font-semibold">Is Seen</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={tab === "property_request" ? 8 : 7} className="text-center py-12 text-muted-foreground">Loading...</TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={tab === "property_request" ? 8 : 7} className="text-center py-12 text-muted-foreground">No Data Found</TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item, idx) => (
                        <TableRow key={item.id} className={`hover:bg-muted/30 ${!item.is_seen ? "bg-primary/5" : ""}`}>
                          <TableCell><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-foreground">{item.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.phone || "—"}</TableCell>
                          {tab === "property_request" && (
                            <TableCell className="text-sm font-medium text-foreground">{item.budget ? `$${item.budget}` : "—"}</TableCell>
                          )}
                          <TableCell>
                            <Badge
                              className={item.is_seen ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}
                              variant="secondary"
                            >
                              {item.is_seen ? "Seen" : "Unseen"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewItem?.inbox_type === "property_request" ? "Property Request" :
               viewItem?.inbox_type === "inquiry" ? "Inquiry" : "Message"} Details
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                  <p className="text-sm font-medium text-foreground">{viewItem.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-foreground">{viewItem.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-medium text-foreground">{viewItem.phone || "—"}</p>
                </div>
                {viewItem.budget && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Budget</p>
                    <p className="text-sm font-medium text-foreground">${viewItem.budget}</p>
                  </div>
                )}
              </div>
              {viewItem.message && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-3">{viewItem.message}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">
                  Received: {format(new Date(viewItem.created_at), "do MMM yyyy hh:mm a")}
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

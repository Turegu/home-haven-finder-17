import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Mail } from "lucide-react";
import { toast } from "sonner";

const AgentInboxPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("inquiry");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (agent) { setCompanyId(agent.company_id); fetchItems(agent.company_id); }
    };
    init();
  }, []);

  const fetchItems = async (cId: string) => {
    setLoading(true);
    const { data } = await supabase.from("company_inbox").select("*").eq("company_id", cId).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => i.inbox_type === tab && (i.full_name.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase())));

  const handleView = async (item: any) => {
    setViewItem(item);
    if (!item.is_seen) {
      await supabase.from("company_inbox").update({ is_seen: true }).eq("id", item.id);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_seen: true } : i));
    }
  };

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Inbox</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="property_request">Property Requests</TabsTrigger>
          <TabsTrigger value="inquiry">Inquiries</TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
        </TabsList>

        <div className="mt-4 mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
          </div>
        </div>

        <TabsContent value={tab}>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                    <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">No items</p>
                  </TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} className={`hover:bg-muted/30 ${!item.is_seen ? "bg-primary/5" : ""}`}>
                    <TableCell className="font-medium">{item.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="secondary" className={item.is_seen ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}>{item.is_seen ? "Seen" : "New"}</Badge></TableCell>
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
            <p><strong>Email:</strong> {viewItem?.email}</p>
            {viewItem?.phone && <p><strong>Phone:</strong> {viewItem.phone}</p>}
            {viewItem?.budget && <p><strong>Budget:</strong> {viewItem.budget}</p>}
            {viewItem?.message && <div><strong>Message:</strong><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{viewItem.message}</p></div>}
            <p className="text-xs text-muted-foreground">Received: {viewItem && new Date(viewItem.created_at).toLocaleString()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
};

export default AgentInboxPage;

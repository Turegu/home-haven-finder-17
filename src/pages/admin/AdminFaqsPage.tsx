import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { turkishIncludes } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Search, Pencil, Trash2, Power, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Faq {
  id: string;
  sort_order: number;
  status: string;
  created_at: string;
  question?: string;
}

const AdminFaqsPage = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchFaqs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const { data: translations } = await supabase
        .from("faq_translations")
        .select("faq_id, question")
        .eq("language_code", "en")
        .in("faq_id", data.map(f => f.id));

      const qMap: Record<string, string> = {};
      if (translations) (translations as any[]).forEach((t: any) => { qMap[t.faq_id] = t.question; });

      setFaqs(data.map(f => ({ ...f, question: qMap[f.id] || "(No English question)" })));
    } else {
      setFaqs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const toggleStatus = async (faq: Faq) => {
    const newStatus = faq.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("faqs").update({ status: newStatus }).eq("id", faq.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `FAQ ${newStatus}` }); fetchFaqs(); }
  };

  const deleteFaq = async (faq: Faq) => {
    if (!confirm("Delete this FAQ permanently?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", faq.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "FAQ deleted" }); fetchFaqs(); }
  };

  const updateOrder = async (faq: Faq, newOrder: number) => {
    const { error } = await supabase.from("faqs").update({ sort_order: newOrder }).eq("id", faq.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchFaqs();
  };

  const filtered = faqs.filter(f =>
    turkishIncludes(f.question || "", search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-foreground">FAQs</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-[220px]"
              />
            </div>
            <Button onClick={() => navigate("/admin/faqs/new")} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add FAQ
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px]">Order</TableHead>
                <TableHead>Question (EN)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="h-10 w-10" />
                      <p className="font-medium">No FAQs Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((faq, idx) => (
                <TableRow key={faq.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">{faq.sort_order}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => updateOrder(faq, faq.sort_order - 1)}
                          disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                        >▲</button>
                        <button
                          onClick={() => updateOrder(faq, faq.sort_order + 1)}
                          disabled={idx === filtered.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
                        >▼</button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{faq.question}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${faq.status === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                      {faq.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4 text-primary" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/faqs/${faq.id}`)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(faq)}>
                          <Power className="h-4 w-4 mr-2" /> {faq.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteFaq(faq)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFaqsPage;

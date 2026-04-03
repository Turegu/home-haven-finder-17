import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useTranslation } from "react-i18next";

interface Faq {
  id: string;
  sort_order: number;
  status: string;
  created_at: string;
  question?: string;
}

const AdminFaqsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: faqs = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const { data: translations } = await supabase
        .from("faq_translations")
        .select("faq_id, question")
        .eq("language_code", "en")
        .in("faq_id", data.map(f => f.id));

      const qMap: Record<string, string> = {};
      if (translations) translations.forEach((tr) => { qMap[tr.faq_id] = tr.question; });

      return data.map(f => ({ ...f, question: qMap[f.id] || "(No English question)" })) as Faq[];
    },
    staleTime: 30_000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });

  const toggleStatus = async (faq: Faq) => {
    const newStatus = faq.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("faqs").update({ status: newStatus }).eq("id", faq.id);
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else { toast({ title: newStatus === "active" ? t("admin.faqActivated") : t("admin.faqDeactivated") }); refetch(); }
  };

  const deleteFaq = async (faq: Faq) => {
    if (!confirm(t("admin.deleteFaqConfirm"))) return;
    const { error } = await supabase.from("faqs").delete().eq("id", faq.id);
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("admin.faqDeleted") }); refetch(); }
  };

  const updateOrder = async (faq: Faq, newOrder: number) => {
    const { error } = await supabase.from("faqs").update({ sort_order: newOrder }).eq("id", faq.id);
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else refetch();
  };

  const filtered = faqs.filter(f =>
    turkishIncludes(f.question || "", search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.faqs")}</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.search")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-[220px]"
              />
            </div>
            <Button onClick={() => navigate("/admin/faqs/new")} size="sm">
              <Plus className="h-4 w-4 mr-2" /> {t("admin.addFaq")}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px]">{t("admin.orderCol")}</TableHead>
                <TableHead>{t("admin.questionEN")}</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead className="text-right">{t("admin.action")}</TableHead>
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
                      <p className="font-medium">{t("admin.noFaqsFound")}</p>
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
                          <Pencil className="h-4 w-4 mr-2" /> {t("admin.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(faq)}>
                          <Power className="h-4 w-4 mr-2" /> {faq.status === "active" ? t("admin.deactivate") : t("admin.activate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteFaq(faq)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> {t("admin.delete")}
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

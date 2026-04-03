import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { MoreVertical, Power, ArrowUpDown, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  sort_order: number;
  status: string;
}

const AdminCurrenciesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [editDialog, setEditDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [selected, setSelected] = useState<Currency | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSymbol, setEditSymbol] = useState("");
  const [editOrder, setEditOrder] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newSymbol, setNewSymbol] = useState("");

  const { data: currencies = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "currencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Currency[];
    },
    staleTime: 30_000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["admin", "currencies"] });

  const toggleStatus = async (c: Currency) => {
    const newStatus = c.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("currencies").update({ status: newStatus }).eq("id", c.id);
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else { toast({ title: newStatus === "active" ? t("admin.active") : t("admin.inactive") }); refetch(); }
  };

  const openEdit = (c: Currency) => {
    setSelected(c); setEditName(c.name); setEditCode(c.code); setEditSymbol(c.symbol); setEditDialog(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await supabase.from("currencies").update({ name: editName, code: editCode, symbol: editSymbol }).eq("id", selected.id);
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("admin.currencyUpdated") }); setEditDialog(false); refetch(); }
  };

  const openOrder = (c: Currency) => { setSelected(c); setEditOrder(String(c.sort_order)); setOrderDialog(true); };

  const saveOrder = async () => {
    if (!selected) return;
    const { error } = await supabase.from("currencies").update({ sort_order: Number(editOrder) }).eq("id", selected.id);
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("admin.orderUpdated") }); setOrderDialog(false); refetch(); }
  };

  const addCurrency = async () => {
    const maxOrder = currencies.length > 0 ? Math.max(...currencies.map(c => c.sort_order)) : 0;
    const { error } = await supabase.from("currencies").insert({ name: newName, code: newCode.toUpperCase(), symbol: newSymbol, sort_order: maxOrder + 1 });
    if (error) toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("admin.currencyAdded") }); setAddDialog(false); setNewName(""); setNewCode(""); setNewSymbol(""); refetch(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.currencies")}</h1>
          <Button onClick={() => setAddDialog(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> {t("admin.addCurrency")}</Button>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t("admin.name")}</TableHead>
                <TableHead>{t("admin.code")}</TableHead>
                <TableHead>{t("admin.symbol")}</TableHead>
                <TableHead>{t("admin.order")}</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead className="text-right">{t("admin.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("admin.loading")}</TableCell></TableRow>
              ) : currencies.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("admin.noCurrenciesFound")}</TableCell></TableRow>
              ) : currencies.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell>{c.sort_order}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${c.status === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                      {c.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4 text-primary" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="h-4 w-4 mr-2" /> {t("admin.edit")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(c)}><Power className="h-4 w-4 mr-2" /> {c.status === "active" ? t("admin.deactivate") : t("admin.activate")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openOrder(c)}><ArrowUpDown className="h-4 w-4 mr-2" /> {t("admin.editOrder")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.editCurrency")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.name")}</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label>{t("admin.code")}</Label><Input value={editCode} onChange={e => setEditCode(e.target.value)} /></div>
            <div><Label>{t("admin.symbol")}</Label><Input value={editSymbol} onChange={e => setEditSymbol(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>{t("admin.cancel")}</Button>
            <Button onClick={saveEdit}>{t("admin.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.editOrder")}</DialogTitle></DialogHeader>
          <div><Label>{t("admin.sortOrder")}</Label><Input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog(false)}>{t("admin.cancel")}</Button>
            <Button onClick={saveOrder}>{t("admin.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.addCurrency")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.name")}</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. US Dollar" /></div>
            <div><Label>{t("admin.code")}</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. USD" /></div>
            <div><Label>{t("admin.symbol")}</Label><Input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="e.g. $" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>{t("admin.cancel")}</Button>
            <Button onClick={addCurrency} disabled={!newName || !newCode || !newSymbol}>{t("admin.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCurrenciesPage;

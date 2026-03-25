import { useState, useEffect } from "react";
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

interface Language {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  status: string;
}

const AdminLanguagesPage = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [selected, setSelected] = useState<Language | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editOrder, setEditOrder] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const fetchLanguages = async () => {
    const { data, error } = await supabase
      .from("languages")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setLanguages(data);
    setLoading(false);
  };

  useEffect(() => { fetchLanguages(); }, []);

  const toggleStatus = async (lang: Language) => {
    const newStatus = lang.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("languages")
      .update({ status: newStatus })
      .eq("id", lang.id);
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "active" ? t("admin.languageActivated") : t("admin.languageDeactivated") });
      fetchLanguages();
    }
  };

  const openEdit = (lang: Language) => {
    setSelected(lang);
    setEditName(lang.name);
    setEditCode(lang.code);
    setEditDialog(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("languages")
      .update({ name: editName, code: editCode })
      .eq("id", selected.id);
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("admin.languageUpdated") });
      setEditDialog(false);
      fetchLanguages();
    }
  };

  const openOrder = (lang: Language) => {
    setSelected(lang);
    setEditOrder(String(lang.sort_order));
    setOrderDialog(true);
  };

  const saveOrder = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("languages")
      .update({ sort_order: Number(editOrder) })
      .eq("id", selected.id);
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("admin.orderUpdated") });
      setOrderDialog(false);
      fetchLanguages();
    }
  };

  const addLanguage = async () => {
    const maxOrder = languages.length > 0 ? Math.max(...languages.map(l => l.sort_order)) : 0;
    const { error } = await supabase
      .from("languages")
      .insert({ name: newName, code: newCode.toLowerCase(), sort_order: maxOrder + 1 });
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("admin.languageAdded") });
      setAddDialog(false);
      setNewName("");
      setNewCode("");
      fetchLanguages();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.languages")}</h1>
          <Button onClick={() => setAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> {t("admin.addLanguage")}
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t("admin.name")}</TableHead>
                <TableHead>{t("admin.code")}</TableHead>
                <TableHead>{t("admin.order")}</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead className="text-right">{t("admin.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : languages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("admin.noLanguagesFound")}</TableCell>
                </TableRow>
              ) : (
                languages.map((lang) => (
                  <TableRow key={lang.id}>
                    <TableCell className="font-medium">{lang.name}</TableCell>
                    <TableCell>{lang.code}</TableCell>
                    <TableCell>{lang.sort_order}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${lang.status === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                        {lang.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(lang)}>
                            <Pencil className="h-4 w-4 mr-2" /> {t("admin.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(lang)}>
                            <Power className="h-4 w-4 mr-2" />
                            {lang.status === "active" ? t("admin.deactivate") : t("admin.activate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openOrder(lang)}>
                            <ArrowUpDown className="h-4 w-4 mr-2" /> {t("admin.editOrder")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.editLanguage")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.name")}</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label>{t("admin.code")}</Label><Input value={editCode} onChange={e => setEditCode(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>{t("admin.cancel")}</Button>
            <Button onClick={saveEdit}>{t("admin.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
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

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.addLanguage")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.name")}</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Spanish" /></div>
            <div><Label>{t("admin.code")}</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. es" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>{t("admin.cancel")}</Button>
            <Button onClick={addLanguage} disabled={!newName || !newCode}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLanguagesPage;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type CrudCategory = "property_types" | "project_types" | "project_statuses" | "interior_amenities" | "exterior_amenities";

interface CrudItem {
  id: string;
  title?: string;
  status: string;
  sort_order?: number;
  created_at: string;
}

const TABS: { key: CrudCategory; label: string }[] = [
  { key: "property_types", label: "Property Types" },
  { key: "project_types", label: "Project Types" },
  { key: "project_statuses", label: "Project Status" },
  { key: "interior_amenities", label: "Interior Amenities" },
  { key: "exterior_amenities", label: "Exterior Amenities" },
];

const AdminCrudsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CrudCategory>("property_types");
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CrudItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStatus, setFormStatus] = useState("active");

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(activeTab)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [activeTab]);

  const openCreate = () => {
    setEditItem(null);
    setFormTitle("");
    setFormStatus("active");
    setDialogOpen(true);
  };

  const openEdit = (item: CrudItem) => {
    setEditItem(item);
    setFormTitle(item.title || "");
    setFormStatus(item.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error(t("admin.titleRequired")); return; }
    const payload: any = { title: formTitle.trim(), status: formStatus };

    if (editItem) {
      const { error } = await supabase.from(activeTab).update(payload).eq("id", editItem.id);
      if (error) toast.error(error.message);
      else { toast.success(t("admin.update")); setDialogOpen(false); fetchItems(); }
    } else {
      const { error } = await supabase.from(activeTab).insert(payload);
      if (error) toast.error(error.message);
      else { toast.success(t("admin.create")); setDialogOpen(false); fetchItems(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("companyDashboard.confirmDelete"))) return;
    const { error } = await supabase.from(activeTab).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("admin.delete")); fetchItems(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.crudsManagement")}</h1>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("admin.create")}</Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CrudCategory)}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <div className="bg-card rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.title")}</TableHead>
                      <TableHead>{t("admin.created")}</TableHead>
                      <TableHead>{t("admin.status")}</TableHead>
                      <TableHead className="w-24">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t("admin.loading")}</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t("common.noData")}</TableCell></TableRow>
                    ) : items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {item.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Create"} {TABS.find(t => t.key === activeTab)?.label.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("admin.title")}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t("admin.title")} />
            </div>
            <div>
              <Label>{t("admin.status")}</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("admin.active")}</SelectItem>
                  <SelectItem value="inactive">{t("admin.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">{editItem ? t("admin.update") : t("admin.create")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCrudsPage;

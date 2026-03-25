import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type CrudCategory = "property_types" | "project_types" | "project_statuses" | "interior_amenities" | "exterior_amenities" | "designations" | "company_types";

interface CrudItem {
  id: string;
  title?: string;
  status: string;
  sort_order?: number;
  translations?: Record<string, string>;
  created_at: string;
}

const TRANSLATION_LANGUAGES = [
  { code: "ar", label: "Arabic", dir: "rtl" },
  { code: "fr", label: "French", dir: "ltr" },
  { code: "tr", label: "Turkish", dir: "ltr" },
  { code: "ru", label: "Russian", dir: "ltr" },
  { code: "de", label: "German", dir: "ltr" },
  { code: "fa", label: "Farsi", dir: "rtl" },
];

const TABS: { key: CrudCategory; label: string; hasTranslations?: boolean }[] = [
  { key: "property_types", label: "Property Types" },
  { key: "project_types", label: "Project Types" },
  { key: "project_statuses", label: "Project Status" },
  { key: "interior_amenities", label: "Interior Amenities" },
  { key: "exterior_amenities", label: "Exterior Amenities" },
  { key: "designations", label: "Agent Designations", hasTranslations: true },
  { key: "company_types", label: "Company Types", hasTranslations: true },
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
  const [formTranslations, setFormTranslations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const currentTabConfig = TABS.find(t => t.key === activeTab);
  const hasTranslations = currentTabConfig?.hasTranslations || false;

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
    setFormTranslations({});
    setDialogOpen(true);
  };

  const openEdit = (item: CrudItem) => {
    setEditItem(item);
    setFormTitle(item.title || "");
    setFormStatus(item.status);
    setFormTranslations(item.translations ? { ...item.translations } : {});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error(t("admin.titleRequired")); return; }
    setSaving(true);

    const payload: any = { title: formTitle.trim(), status: formStatus };
    if (hasTranslations) {
      payload.translations = formTranslations;
    }

    if (editItem) {
      const { error } = await supabase.from(activeTab).update(payload).eq("id", editItem.id);
      if (error) toast.error(error.message);
      else { toast.success(t("admin.update")); setDialogOpen(false); fetchItems(); }
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 1;
      payload.sort_order = maxOrder;
      const { error } = await supabase.from(activeTab).insert(payload);
      if (error) toast.error(error.message);
      else { toast.success(t("admin.create")); setDialogOpen(false); fetchItems(); }
    }
    setSaving(false);
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
                      <TableHead>#</TableHead>
                      <TableHead>{t("admin.title")}</TableHead>
                      {tab.hasTranslations && <TableHead>Translations</TableHead>}
                      <TableHead>{t("admin.status")}</TableHead>
                      <TableHead className="w-24">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={tab.hasTranslations ? 5 : 4} className="text-center py-8 text-muted-foreground">{t("admin.loading")}</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={tab.hasTranslations ? 5 : 4} className="text-center py-8 text-muted-foreground">{t("common.noData")}</TableCell></TableRow>
                    ) : items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        {tab.hasTranslations && (
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.translations && Object.entries(item.translations).filter(([, v]) => v).map(([code, val]) => (
                                <Badge key={code} variant="outline" className="text-[10px] gap-1">
                                  <span className="font-semibold uppercase">{code}</span> {val}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">
                            {item.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Create"} {currentTabConfig?.label.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">English Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Enter title in English" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("admin.status")}</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("admin.active")}</SelectItem>
                  <SelectItem value="inactive">{t("admin.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasTranslations && (
              <Tabs defaultValue="ar" className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Translations</span>
                </div>
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {TRANSLATION_LANGUAGES.map((lang) => (
                    <TabsTrigger key={lang.code} value={lang.code} className="text-xs">
                      {lang.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {TRANSLATION_LANGUAGES.map((lang) => (
                  <TabsContent key={lang.code} value={lang.code}>
                    <Input
                      value={formTranslations[lang.code] || ""}
                      onChange={(e) => setFormTranslations(prev => ({ ...prev, [lang.code]: e.target.value }))}
                      placeholder={`${lang.label} translation`}
                      dir={lang.dir}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t("admin.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("admin.saving") : editItem ? t("admin.update") : t("admin.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCrudsPage;

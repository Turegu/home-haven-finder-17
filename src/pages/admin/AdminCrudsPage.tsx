import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface CrudItem {
  id: string;
  title?: string;
  status: string;
  sort_order?: number;
  translations?: Record<string, string>;
  created_at: string;
  category_id?: string;
}

const TRANSLATION_LANGUAGES = [
  { code: "ar", label: "Arabic", dir: "rtl" },
  { code: "fr", label: "French", dir: "ltr" },
  { code: "tr", label: "Turkish", dir: "ltr" },
  { code: "ru", label: "Russian", dir: "ltr" },
  { code: "de", label: "German", dir: "ltr" },
  { code: "fa", label: "Farsi", dir: "rtl" },
];

const STANDALONE_TABS = [
  { key: "designations", label: "Agent Designations", table: "designations" as const },
  { key: "company_types", label: "Company Types", table: "company_types" as const },
];

interface FilterCategory {
  id: string;
  category_key: string;
  title: string;
  sort_order: number;
  translations: Record<string, string>;
}

const AdminCrudsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("");
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CrudItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [formTranslations, setFormTranslations] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);

  const standaloneTab = STANDALONE_TABS.find(s => s.key === activeTab);
  const filterCategory = filterCategories.find(c => c.category_key === activeTab);

  useEffect(() => {
    supabase.from("filter_categories").select("*").order("sort_order").then(({ data }) => {
      const cats = (data as FilterCategory[]) || [];
      setFilterCategories(cats);
      if (cats.length > 0) setActiveTab(cats[0].category_key);
    });
  }, []);

  const allTabs = useMemo(() => {
    const filterTabs = filterCategories.map(c => ({ key: c.category_key, label: c.title }));
    const standalone = STANDALONE_TABS.map(s => ({ key: s.key, label: s.label }));
    return [...filterTabs, ...standalone];
  }, [filterCategories]);

  const fetchItems = async () => {
    if (!activeTab) return;
    setLoading(true);
    if (standaloneTab) {
      const { data, error } = await supabase.from(standaloneTab.table).select("*").order("sort_order", { ascending: true });
      if (error) toast.error(error.message);
      else setItems((data as any[]) || []);
    } else if (filterCategory) {
      const { data, error } = await supabase.from("filter_options").select("*").eq("category_id", filterCategory.id).order("sort_order", { ascending: true });
      if (error) toast.error(error.message);
      else setItems((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [activeTab, filterCategories]);

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
    const payload: any = { title: formTitle.trim(), status: formStatus, translations: formTranslations };

    if (standaloneTab) {
      if (editItem) {
        const { error } = await supabase.from(standaloneTab.table).update(payload).eq("id", editItem.id);
        if (error) toast.error(error.message);
        else { toast.success(t("admin.update")); setDialogOpen(false); fetchItems(); }
      } else {
        payload.sort_order = items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 1;
        const { error } = await supabase.from(standaloneTab.table).insert(payload);
        if (error) toast.error(error.message);
        else { toast.success(t("admin.create")); setDialogOpen(false); fetchItems(); }
      }
    } else if (filterCategory) {
      payload.category_id = filterCategory.id;
      if (editItem) {
        const { error } = await supabase.from("filter_options").update(payload).eq("id", editItem.id);
        if (error) toast.error(error.message);
        else { toast.success(t("admin.update")); setDialogOpen(false); fetchItems(); }
      } else {
        payload.sort_order = items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 1;
        const { error } = await supabase.from("filter_options").insert(payload);
        if (error) toast.error(error.message);
        else { toast.success(t("admin.create")); setDialogOpen(false); fetchItems(); }
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("companyDashboard.confirmDelete"))) return;
    const table = standaloneTab ? standaloneTab.table : "filter_options";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("admin.delete")); fetchItems(); }
  };

  const currentTabLabel = allTabs.find(tb => tb.key === activeTab)?.label || activeTab;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.crudsManagement")}</h1>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("admin.create")}</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 max-w-full">
            {allTabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs whitespace-nowrap">{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("admin.title")}</TableHead>
                <TableHead>Translations</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead className="w-24">{t("admin.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("admin.loading")}</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("common.noData")}</TableCell></TableRow>
              ) : items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.translations && Object.entries(item.translations).filter(([, v]) => v).map(([code, val]) => (
                        <Badge key={code} variant="outline" className="text-[10px] gap-1">
                          <span className="font-semibold uppercase">{code}</span> {val}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Create"} {currentTabLabel.replace(/s$/, "")}</DialogTitle>
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

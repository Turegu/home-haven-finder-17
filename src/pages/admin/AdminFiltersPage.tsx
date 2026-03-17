import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ChevronRight, GripVertical, Globe, Upload } from "lucide-react";
import FilterExcelUpload from "@/components/admin/FilterExcelUpload";

const LANGUAGES = [
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "ru", label: "Russian" },
  { code: "de", label: "German" },
  { code: "fa", label: "Farsi" },
];

interface FilterCategory {
  id: string;
  category_key: string;
  title: string;
  translations: Record<string, string>;
  applies_to: string[];
  sort_order: number;
  status: string;
}

interface FilterOption {
  id: string;
  category_id: string;
  title: string;
  translations: Record<string, string>;
  sort_order: number;
  status: string;
}

const AdminFiltersPage = () => {
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"category" | "option">("option");
  const [editingItem, setEditingItem] = useState<FilterCategory | FilterOption | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTranslations, setFormTranslations] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) fetchOptions(selectedCategory.id);
  }, [selectedCategory]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("filter_categories")
      .select("*")
      .order("sort_order");
    if (error) {
      toast.error("Failed to load categories");
    } else {
      const cats = (data || []) as unknown as FilterCategory[];
      setCategories(cats);
      if (!selectedCategory && cats.length > 0) setSelectedCategory(cats[0]);
    }
    setLoading(false);
  }

  async function fetchOptions(categoryId: string) {
    const { data, error } = await supabase
      .from("filter_options")
      .select("*")
      .eq("category_id", categoryId)
      .order("sort_order");
    if (error) {
      toast.error("Failed to load options");
    } else {
      setOptions((data || []) as unknown as FilterOption[]);
    }
  }

  function openAddOption() {
    setDialogType("option");
    setEditingItem(null);
    setFormTitle("");
    setFormTranslations({});
    setFormStatus("active");
    setDialogOpen(true);
  }

  function openEditOption(opt: FilterOption) {
    setDialogType("option");
    setEditingItem(opt);
    setFormTitle(opt.title);
    setFormTranslations({ ...opt.translations });
    setFormStatus(opt.status);
    setDialogOpen(true);
  }

  function openEditCategory(cat: FilterCategory) {
    setDialogType("category");
    setEditingItem(cat);
    setFormTitle(cat.title);
    setFormTranslations({ ...cat.translations });
    setFormStatus(cat.status);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    if (dialogType === "option") {
      if (editingItem) {
        const { error } = await supabase
          .from("filter_options")
          .update({ title: formTitle, translations: formTranslations as unknown as Record<string, never>, status: formStatus })
          .eq("id", editingItem.id);
        if (error) toast.error("Failed to update");
        else toast.success("Option updated");
      } else {
        const maxOrder = options.length > 0 ? Math.max(...options.map(o => o.sort_order)) + 1 : 1;
        const { error } = await supabase
          .from("filter_options")
          .insert({
            category_id: selectedCategory!.id,
            title: formTitle,
            translations: formTranslations as unknown as Record<string, never>,
            sort_order: maxOrder,
            status: formStatus,
          });
        if (error) toast.error("Failed to add option");
        else toast.success("Option added");
      }
      if (selectedCategory) fetchOptions(selectedCategory.id);
    } else {
      if (editingItem) {
        const { error } = await supabase
          .from("filter_categories")
          .update({ title: formTitle, translations: formTranslations as unknown as Record<string, never>, status: formStatus })
          .eq("id", editingItem.id);
        if (error) toast.error("Failed to update");
        else toast.success("Category updated");
      }
      fetchCategories();
    }

    setDialogOpen(false);
    setSaving(false);
  }

  async function handleDelete(optionId: string) {
    if (!confirm("Are you sure you want to delete this option?")) return;
    const { error } = await supabase.from("filter_options").delete().eq("id", optionId);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Option deleted");
      if (selectedCategory) fetchOptions(selectedCategory.id);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Filter Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage filter categories and options used across listings, search, and forms
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => setExcelDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import from Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Categories</h3>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                  selectedCategory?.id === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{cat.title}</span>
                  <div className="flex gap-1 mt-1">
                    {cat.applies_to.map(t => (
                      <Badge key={t} variant="outline" className={`text-[10px] px-1 py-0 ${selectedCategory?.id === cat.id ? 'border-primary-foreground/40 text-primary-foreground/80' : ''}`}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 opacity-0 group-hover:opacity-100 ${selectedCategory?.id === cat.id ? 'text-primary-foreground hover:bg-primary-foreground/20' : ''}`}
                    onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <ChevronRight className={`h-4 w-4 ${selectedCategory?.id === cat.id ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Options table */}
          <div className="lg:col-span-3">
            {selectedCategory && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{selectedCategory.title}</h2>
                    <p className="text-xs text-muted-foreground">{options.length} options</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCategoryExcelOpen(true)}>
                      <Upload className="h-4 w-4 mr-1" /> Import Excel
                    </Button>
                    <Button size="sm" onClick={openAddOption}>
                      <Plus className="h-4 w-4 mr-1" /> Add Option
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>English</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" /> Translations
                          </div>
                        </TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {options.map((opt, idx) => (
                        <TableRow key={opt.id}>
                          <TableCell className="text-muted-foreground text-xs">
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                              {idx + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{opt.title}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {LANGUAGES.map((lang) => {
                                const val = opt.translations?.[lang.code];
                                return val ? (
                                  <Badge key={lang.code} variant="secondary" className="text-[10px] font-normal">
                                    {lang.code.toUpperCase()}: {val.length > 15 ? val.slice(0, 15) + "…" : val}
                                  </Badge>
                                ) : (
                                  <Badge key={lang.code} variant="outline" className="text-[10px] text-muted-foreground/50">
                                    {lang.code.toUpperCase()}: —
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={opt.status === "active" ? "default" : "secondary"} className="text-xs">
                              {opt.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditOption(opt)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(opt.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {options.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No options yet. Click "Add Option" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Add"} {dialogType === "category" ? "Category" : "Option"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">English Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Enter title in English" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="tr" className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Translations</span>
              </div>
              <TabsList className="flex flex-wrap h-auto gap-1">
                {LANGUAGES.map((lang) => (
                  <TabsTrigger key={lang.code} value={lang.code} className="text-xs">
                    {lang.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LANGUAGES.map((lang) => (
                <TabsContent key={lang.code} value={lang.code}>
                  <Input
                    value={formTranslations[lang.code] || ""}
                    onChange={(e) => setFormTranslations(prev => ({ ...prev, [lang.code]: e.target.value }))}
                    placeholder={`${lang.label} translation`}
                    dir={lang.code === "ar" || lang.code === "fa" ? "rtl" : "ltr"}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilterExcelUpload
        open={excelDialogOpen}
        onOpenChange={setExcelDialogOpen}
        onImportComplete={() => { fetchCategories(); }}
      />
    </AdminLayout>
  );
};

export default AdminFiltersPage;

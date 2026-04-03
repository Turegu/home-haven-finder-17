import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { turkishIncludes } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search, ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useTestMode, getTestAwareEndDate, getTestAwareDurationLabel } from "@/hooks/useTestMode";

interface Banner {
  id: string;
  name: string;
  page_name: string;
  banner_type: string;
  page_position: number;
  image_url: string | null;
  link_url: string | null;
  banner_text: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
}

const PAGE_OPTIONS = [
  { value: "buy", label: "Buy" },
  { value: "buy-detail", label: "Buy Detail" },
  { value: "rent", label: "Rent" },
  { value: "rent-detail", label: "Rent Detail" },
  { value: "projects", label: "Projects" },
  { value: "project-detail", label: "Project Detail" },
  { value: "events", label: "Events" },
  { value: "event-detail", label: "Event Detail" },
  { value: "agents", label: "Agents" },
  { value: "property-request", label: "Property Request" },
  { value: "banks", label: "Mortgage Banks" },
];

const POSITION_OPTIONS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
];

const DURATION_OPTIONS = [
  { value: 1, label: "1 Month" },
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
];

const emptyForm = {
  name: "",
  page_name: "buy",
  banner_type: "horizontal",
  page_position: 1,
  link_url: "",
  banner_text: "",
  duration_months: 1,
};

const AdminBannersPage = () => {
  const { isTestMode } = useTestMode();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as Banner[]) || [];
    },
    staleTime: 30_000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    // Try to infer duration from start/end dates, default to 1
    let duration_months = 1;
    if (banner.start_date && banner.end_date) {
      const diffMs = new Date(banner.end_date).getTime() - new Date(banner.start_date).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 150) duration_months = 6;
      else if (diffDays > 60) duration_months = 3;
    }
    setForm({
      name: banner.name,
      page_name: banner.page_name,
      banner_type: banner.banner_type,
      page_position: banner.page_position,
      link_url: banner.link_url || "",
      banner_text: banner.banner_text || "",
      duration_months,
    });
    setImageFile(null);
    setImagePreview(banner.image_url);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.name) { toast.error(t("admin.bannerNameRequired")); return; }
    setSaving(true);

    let image_url = editing?.image_url || null;

    // Upload image if new file selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(path, imageFile);
      if (uploadError) {
        toast.error(t("admin.failedToUploadImage"));
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const now = new Date();
    const start_date = now.toISOString();
    const end_date = getTestAwareEndDate(form.duration_months, isTestMode);

    const payload = {
      name: form.name,
      page_name: form.page_name,
      banner_type: form.banner_type,
      page_position: form.page_position,
      link_url: form.link_url || null,
      banner_text: form.banner_text || null,
      image_url,
      start_date,
      end_date,
    };

    if (editing) {
      const { error } = await supabase.from("banners").update(payload).eq("id", editing.id);
      if (error) toast.error(t("admin.failedToUpdateBanner"));
      else toast.success(t("admin.bannerUpdated"));
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) toast.error(t("admin.failedToCreateBanner"));
      else toast.success(t("admin.bannerCreated"));
    }

    setSaving(false);
    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.deleteThisBanner"))) return;
    await supabase.from("banners").delete().eq("id", id);
    toast.success(t("admin.bannerDeleted"));
    refetch();
  };

  const filtered = banners.filter(
    (b) => turkishIncludes(b.name, search)
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.bannersManagement")}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> {t("admin.newBanner")}
        </Button>
      </div>

      {/* Info box */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground mb-2">{t("admin.requiredBannerDimensions")}</p>
        <p>Horizontal (listing pages): <span className="font-medium text-foreground">1172 × 206 px</span></p>
        <p>Horizontal (detail pages): <span className="font-medium text-foreground">1172 × 206 px</span></p>
        <p>Vertical (sidebar): <span className="font-medium text-foreground">225 × 513 px</span></p>
        <p>Homepage Hero Banner: <span className="font-medium text-foreground">1920 × 800 px</span> (aspect 21:9)</p>
        <p>Second Banner (below search): <span className="font-medium text-foreground">1172 × 180 px</span></p>
        <p>Company Cover / Agent Banner: <span className="font-medium text-foreground">1200 × 180 px</span></p>
        <p>Company / Agent Logo: <span className="font-medium text-foreground">200 × 200 px</span></p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.searchByBannerName")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.bannerName")}</TableHead>
              <TableHead>{t("admin.page")}</TableHead>
              <TableHead>{t("admin.type")}</TableHead>
              <TableHead>{t("admin.position")}</TableHead>
              <TableHead>{t("admin.startDate")}</TableHead>
              <TableHead>{t("admin.endDate")}</TableHead>
              <TableHead>{t("admin.preview")}</TableHead>
              <TableHead className="text-right">{t("admin.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("admin.loading")}</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("admin.noBannersFound")}</TableCell>
              </TableRow>
            ) : (
              filtered.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-medium">{banner.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                      {PAGE_OPTIONS.find((p) => p.value === banner.page_name)?.label || banner.page_name}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{banner.banner_type}</TableCell>
                  <TableCell>{POSITION_OPTIONS.find((p) => p.value === banner.page_position)?.label || banner.page_position}</TableCell>
                  <TableCell className="text-xs">{banner.start_date ? new Date(banner.start_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-xs">{banner.end_date ? new Date(banner.end_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    {banner.image_url ? (
                      <img src={banner.image_url} alt="" className="h-8 rounded border border-border object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(banner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.editBanner") : t("admin.newBanner")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="bg-muted/50 border border-border rounded-md p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">{t("admin.requiredDimensions")}</p>
              <p>Horizontal: 1172 × 206 px &nbsp;|&nbsp; Vertical: 225 × 513 px</p>
            </div>

            <div>
              <Label>{t("admin.bannerName")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("admin.enterBannerName")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("admin.page")}</Label>
                <Select value={form.page_name} onValueChange={(v) => setForm({ ...form, page_name: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("admin.bannerType")}</Label>
                <Select value={form.banner_type} onValueChange={(v) => setForm({ ...form, banner_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">{t("admin.horizontal")}</SelectItem>
                    <SelectItem value="vertical">{t("admin.vertical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t("admin.duration")} {isTestMode && <span className="text-xs text-amber-500 ml-1">(minutes in test mode)</span>}</Label>
              <Select value={String(form.duration_months)} onValueChange={(v) => setForm({ ...form, duration_months: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {getTestAwareDurationLabel(d.value, isTestMode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("admin.pagePosition")}</Label>
                <Select value={String(form.page_position)} onValueChange={(v) => setForm({ ...form, page_position: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("admin.linkUrl")}</Label>
                <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://example.com" />
              </div>
            </div>

            {/* Banner Text */}
            <div>
              <Label>{t("admin.bannerTextOverlay")}</Label>
              <Input value={form.banner_text} onChange={(e) => setForm({ ...form, banner_text: e.target.value })} placeholder={t("admin.enterBannerText")} />
            </div>

            {/* Image Upload */}
            <div>
              <Label>{t("admin.bannerImage")}</Label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded object-contain" />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                    {t("admin.clickToUploadBanner")}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>{t("admin.cancel")}</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? t("admin.saving") : editing ? t("admin.updateBanner") : t("admin.createBanner")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBannersPage;

import { useState, useEffect, useRef } from "react";
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
import { Plus, Trash2, Pencil, Upload, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type CrudCategory = "property_types" | "project_types" | "project_statuses" | "interior_amenities" | "exterior_amenities" | "partners" | "featured_locations";

interface CrudItem {
  id: string;
  title?: string;
  name?: string;
  status: string;
  sort_order?: number;
  created_at: string;
  logo_url?: string;
  link_url?: string;
  image_url?: string;
}

const TABS: { key: CrudCategory; label: string; hasImage?: boolean; hasLink?: boolean; nameField?: string }[] = [
  { key: "property_types", label: "Property Types" },
  { key: "project_types", label: "Project Types" },
  { key: "project_statuses", label: "Project Status" },
  { key: "interior_amenities", label: "Interior Amenities" },
  { key: "exterior_amenities", label: "Exterior Amenities" },
  { key: "partners", label: "Our Partners", hasImage: true, hasLink: true, nameField: "name" },
  { key: "featured_locations", label: "Featured Locations", hasImage: true, hasLink: true, nameField: "name" },
];

const AdminCrudsPage = () => {
  const [activeTab, setActiveTab] = useState<CrudCategory>("property_types");
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CrudItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [formLink, setFormLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tabConfig = TABS.find((t) => t.key === activeTab)!;
  const nameField = tabConfig.nameField || "title";
  const imageField = activeTab === "partners" ? "logo_url" : "image_url";
  const bucket = activeTab === "partners" ? "partner-logos" : "featured-location-images";

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
    setFormLink("");
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CrudItem) => {
    setEditItem(item);
    setFormTitle((item as any)[nameField] || "");
    setFormStatus(item.status);
    setFormLink(item.link_url || "");
    setImagePreview((item as any)[imageField] || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    setImagePreview(urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Title is required"); return; }
    const payload: any = { [nameField]: formTitle.trim(), status: formStatus };
    if (tabConfig.hasLink) payload.link_url = formLink || null;
    if (tabConfig.hasImage) payload[imageField] = imagePreview || null;

    if (editItem) {
      const { error } = await supabase.from(activeTab).update(payload).eq("id", editItem.id);
      if (error) toast.error(error.message);
      else { toast.success("Updated"); setDialogOpen(false); fetchItems(); }
    } else {
      const { error } = await supabase.from(activeTab).insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Created"); setDialogOpen(false); fetchItems(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from(activeTab).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchItems(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">CRUDs Management</h1>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create</Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CrudCategory)}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.key} value={t.key}>
              <div className="bg-card rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {t.hasImage && <TableHead className="w-20">Image</TableHead>}
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={t.hasImage ? 5 : 4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={t.hasImage ? 5 : 4} className="text-center py-8 text-muted-foreground">No items yet</TableCell></TableRow>
                    ) : items.map((item) => (
                      <TableRow key={item.id}>
                        {t.hasImage && (
                          <TableCell>
                            {(item as any)[t.key === "partners" ? "logo_url" : "image_url"] ? (
                              <img src={(item as any)[t.key === "partners" ? "logo_url" : "image_url"]} alt="" className="w-14 h-14 object-cover rounded border border-border" />
                            ) : (
                              <div className="w-14 h-14 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{(item as any)[t.nameField || "title"]}</TableCell>
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
            <DialogTitle>{editItem ? "Edit" : "Create"} {tabConfig.label.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{nameField === "name" ? "Name" : "Title"}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={`Enter ${nameField}`} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tabConfig.hasImage && (
              <div>
                <Label>{activeTab === "partners" ? "Logo" : "Thumbnail"}</Label>
                <div className="mt-1">
                  {imagePreview && <img src={imagePreview} alt="" className="w-24 h-24 object-cover rounded border border-border mb-2" />}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />{uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
              </div>
            )}
            {tabConfig.hasLink && (
              <div>
                <Label>Link URL</Label>
                <Input value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://..." />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">{editItem ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCrudsPage;

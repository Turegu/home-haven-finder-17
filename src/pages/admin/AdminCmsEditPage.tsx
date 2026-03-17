import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface FeaturedLocation {
  id: string;
  name: string;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  status: string;
}

const AdminCmsEditPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pageId, setPageId] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [content, setContent] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Featured locations state
  const [locations, setLocations] = useState<FeaturedLocation[]>([]);
  const [locDialog, setLocDialog] = useState(false);
  const [editingLoc, setEditingLoc] = useState<FeaturedLocation | null>(null);
  const [locForm, setLocForm] = useState({ name: "", link_url: "", sort_order: 0 });
  const [locImageFile, setLocImageFile] = useState<File | null>(null);
  const [locImagePreview, setLocImagePreview] = useState<string | null>(null);
  const locFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPage = async () => {
      const { data } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("page_slug", slug!)
        .limit(1);
      if (data && data.length > 0) {
        const page = data[0] as any;
        setPageId(page.id);
        setPageTitle(page.page_title);
        setContent(page.content as Record<string, any>);
      }
      setLoading(false);
    };
    fetchPage();
    if (slug === "home") fetchLocations();
  }, [slug]);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("featured_locations")
      .select("*")
      .order("sort_order");
    setLocations((data as FeaturedLocation[]) || []);
  };

  const updateSection = (section: string, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("cms-images").upload(path, file);
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from("cms-images").getPublicUrl(path);
    return data.publicUrl;
  };

  // Image upload refs for hero/second banner
  const heroFileRef = useRef<HTMLInputElement>(null);
  const secondBannerFileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    file: File,
    section: string,
    field: string = "image_url"
  ) => {
    const url = await uploadImage(file, section);
    if (url) updateSection(section, field, url);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("cms_pages")
      .update({ content })
      .eq("id", pageId);
    if (error) toast.error("Failed to save");
    else toast.success("Page saved successfully");
    setSaving(false);
  };

  // Featured location CRUD
  const openLocCreate = () => {
    setEditingLoc(null);
    setLocForm({ name: "", link_url: "", sort_order: locations.length });
    setLocImageFile(null);
    setLocImagePreview(null);
    setLocDialog(true);
  };

  const openLocEdit = (loc: FeaturedLocation) => {
    setEditingLoc(loc);
    setLocForm({ name: loc.name, link_url: loc.link_url || "", sort_order: loc.sort_order });
    setLocImageFile(null);
    setLocImagePreview(loc.image_url);
    setLocDialog(true);
  };

  const handleLocSave = async () => {
    if (!locForm.name) { toast.error("Name is required"); return; }
    let image_url = editingLoc?.image_url || null;
    if (locImageFile) {
      image_url = await uploadImage(locImageFile, "locations");
    }
    const payload = { name: locForm.name, link_url: locForm.link_url || null, image_url, sort_order: locForm.sort_order };
    if (editingLoc) {
      await supabase.from("featured_locations").update(payload).eq("id", editingLoc.id);
      toast.success("Location updated");
    } else {
      await supabase.from("featured_locations").insert(payload);
      toast.success("Location created");
    }
    setLocDialog(false);
    fetchLocations();
  };

  const handleLocDelete = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    await supabase.from("featured_locations").delete().eq("id", id);
    toast.success("Location deleted");
    fetchLocations();
  };

  if (loading) {
    return <AdminLayout><p className="text-muted-foreground py-8">Loading...</p></AdminLayout>;
  }

  const hero = content.hero || {};
  const secondBanner = content.second_banner || {};
  const featProps = content.featured_properties || {};
  const featProjects = content.featured_projects || {};
  const featLocs = content.featured_locations || {};
  const partners = content.partners || {};

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cms")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* Hero Section */}
        {slug === "home" && (
          <>
            <SectionCard title="Hero" subtitle="Bg (2000px × 560px)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input ref={heroFileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero")} />
                  <div
                    onClick={() => heroFileRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                  >
                    {hero.image_url ? (
                      <img src={hero.image_url} alt="Hero" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground text-sm">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                        Click to upload
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input value={hero.title || ""} onChange={(e) => updateSection("hero", "title", e.target.value)} />
                  </div>
                  <div>
                    <Label>SubTitle</Label>
                    <Input value={hero.subtitle || ""} onChange={(e) => updateSection("hero", "subtitle", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Link URL</Label>
                  <Input value={hero.link_url || ""} onChange={(e) => updateSection("hero", "link_url", e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>Link Text</Label>
                  <Input value={hero.link_text || ""} onChange={(e) => updateSection("hero", "link_text", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  checked={hero.enable_link ?? true}
                  onCheckedChange={(v) => updateSection("hero", "enable_link", v)}
                />
                <Label className="mb-0">Enable Link</Label>
              </div>
            </SectionCard>

            {/* Second Banner */}
            <SectionCard title="Second Banner" subtitle="Advertising banner below hero (slightly smaller)">
              <input ref={secondBannerFileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "second_banner")} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => secondBannerFileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {secondBanner.image_url ? (
                    <img src={secondBanner.image_url} alt="Banner 2" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground text-sm">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                      Click to upload
                    </div>
                  )}
                </div>
                <div>
                  <Label>Link URL</Label>
                  <Input value={secondBanner.link_url || ""} onChange={(e) => updateSection("second_banner", "link_url", e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </SectionCard>

            {/* Featured Properties */}
            <SectionCard title="Featured Properties">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={featProps.title || ""} onChange={(e) => updateSection("featured_properties", "title", e.target.value)} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={featProps.tagline || ""} onChange={(e) => updateSection("featured_properties", "tagline", e.target.value)} />
                </div>
              </div>
            </SectionCard>

            {/* Featured Projects */}
            <SectionCard title="Featured Projects">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={featProjects.title || ""} onChange={(e) => updateSection("featured_projects", "title", e.target.value)} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={featProjects.tagline || ""} onChange={(e) => updateSection("featured_projects", "tagline", e.target.value)} />
                </div>
              </div>
            </SectionCard>

            {/* Featured Locations */}
            <SectionCard title="Featured Locations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Title</Label>
                  <Input value={featLocs.title || ""} onChange={(e) => updateSection("featured_locations", "title", e.target.value)} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={featLocs.tagline || ""} onChange={(e) => updateSection("featured_locations", "tagline", e.target.value)} />
                </div>
              </div>

              {/* Location cards management */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">Location Cards</p>
                  <Button size="sm" onClick={openLocCreate} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Location
                  </Button>
                </div>
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No featured locations yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {locations.map((loc) => (
                      <div key={loc.id} className="border border-border rounded-lg overflow-hidden bg-background">
                        {loc.image_url ? (
                          <img src={loc.image_url} alt={loc.name} className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{loc.name}</span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openLocEdit(loc)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleLocDelete(loc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Partners */}
            <SectionCard title="Our Partners">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={partners.title || ""} onChange={(e) => updateSection("partners", "title", e.target.value)} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={partners.tagline || ""} onChange={(e) => updateSection("partners", "tagline", e.target.value)} />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Featured Location Dialog */}
      <Dialog open={locDialog} onOpenChange={setLocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLoc ? "Edit Featured Location" : "Create Featured Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <input ref={locFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setLocImageFile(f); setLocImagePreview(URL.createObjectURL(f)); }
              }} />
            <div
              onClick={() => locFileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
            >
              {locImagePreview ? (
                <img src={locImagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                  Click to upload image
                </div>
              )}
            </div>
            <div>
              <Label>Name</Label>
              <Input value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Link</Label>
              <Input value={locForm.link_url} onChange={(e) => setLocForm({ ...locForm, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setLocDialog(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleLocSave}>
                {editingLoc ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-muted/30 border border-border rounded-xl p-6">
    <h2 className="text-lg font-bold text-foreground mb-1">{title}</h2>
    {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </div>
);

export default AdminCmsEditPage;

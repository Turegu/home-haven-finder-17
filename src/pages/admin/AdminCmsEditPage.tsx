import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
  sort_order: number;
  status: string;
}

const AdminCmsEditPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pageId, setPageId] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [content, setContent] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Featured locations state (home page only)
  const [locations, setLocations] = useState<FeaturedLocation[]>([]);
  const [locDialog, setLocDialog] = useState(false);
  const [editingLoc, setEditingLoc] = useState<FeaturedLocation | null>(null);
  const [locForm, setLocForm] = useState({ name: "", link_url: "", sort_order: 0, tagline: "", subtitle: "" });
  const [locImageFile, setLocImageFile] = useState<File | null>(null);
  const [locImagePreview, setLocImagePreview] = useState<string | null>(null);
  const locFileRef = useRef<HTMLInputElement>(null);

  // Partners state (home page only)
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerDialog, setPartnerDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: "", link_url: "" });
  const [partnerImageFile, setPartnerImageFile] = useState<File | null>(null);
  const [partnerImagePreview, setPartnerImagePreview] = useState<string | null>(null);
  const partnerFileRef = useRef<HTMLInputElement>(null);

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
    if (slug === "home") { fetchLocations(); fetchPartners(); }
  }, [slug]);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("featured_locations")
      .select("*")
      .order("sort_order");
    setLocations((data as FeaturedLocation[]) || []);
  };

  const fetchPartners = async () => {
    const { data } = await supabase
      .from("partners")
      .select("*")
      .order("sort_order");
    setPartners((data as Partner[]) || []);
  };

  // Partner CRUD
  const openPartnerCreate = () => {
    setEditingPartner(null);
    setPartnerForm({ name: "", link_url: "" });
    setPartnerImageFile(null);
    setPartnerImagePreview(null);
    setPartnerDialog(true);
  };
  const openPartnerEdit = (p: Partner) => {
    setEditingPartner(p);
    setPartnerForm({ name: p.name, link_url: p.link_url || "" });
    setPartnerImageFile(null);
    setPartnerImagePreview(p.logo_url);
    setPartnerDialog(true);
  };
  const handlePartnerSave = async () => {
    if (!partnerForm.name) { toast.error(t("admin.nameRequired")); return; }
    let logo_url = editingPartner?.logo_url || null;
    if (partnerImageFile) logo_url = await uploadImage(partnerImageFile, "partners");
    const payload = { name: partnerForm.name, link_url: partnerForm.link_url || null, logo_url, sort_order: editingPartner?.sort_order ?? partners.length };
    if (editingPartner) {
      await supabase.from("partners").update(payload).eq("id", editingPartner.id);
      toast.success(t("admin.partnerUpdated"));
    } else {
      await supabase.from("partners").insert(payload);
      toast.success(t("admin.partnerCreated"));
    }
    setPartnerDialog(false);
    fetchPartners();
  };
  const handlePartnerDelete = async (id: string) => {
    if (!confirm(t("admin.deletePartnerConfirm"))) return;
    await supabase.from("partners").delete().eq("id", id);
    toast.success(t("admin.partnerDeleted"));
    fetchPartners();
  };

  const updateSection = (section: string, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const updateNestedField = (path: string[], value: any) => {
    setContent((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      let obj = updated;
      for (let i = 0; i < path.length - 1; i++) {
        if (!obj[path[i]]) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return updated;
    });
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("cms-images").upload(path, file);
    if (error) { toast.error(t("admin.uploadFailed")); return null; }
    const { data } = supabase.storage.from("cms-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("cms_pages")
      .update({ content })
      .eq("id", pageId);
    if (error) toast.error(t("admin.failedToSave"));
    else toast.success(t("admin.pageSaved"));
    setSaving(false);
  };

  // Featured location CRUD
  const openLocCreate = () => {
    setEditingLoc(null);
    setLocForm({ name: "", link_url: "", sort_order: locations.length, tagline: "", subtitle: "" });
    setLocImageFile(null);
    setLocImagePreview(null);
    setLocDialog(true);
  };
  const openLocEdit = (loc: FeaturedLocation) => {
    setEditingLoc(loc);
    setLocForm({ name: loc.name, link_url: loc.link_url || "", sort_order: loc.sort_order, tagline: (loc as any).tagline || "", subtitle: (loc as any).subtitle || "" });
    setLocImageFile(null);
    setLocImagePreview(loc.image_url);
    setLocDialog(true);
  };
  const handleLocSave = async () => {
    if (!locForm.name) { toast.error(t("admin.nameRequired")); return; }
    let image_url = editingLoc?.image_url || null;
    if (locImageFile) image_url = await uploadImage(locImageFile, "locations");
    const payload = { name: locForm.name, link_url: locForm.link_url || null, image_url, sort_order: locForm.sort_order, tagline: locForm.tagline || null, subtitle: locForm.subtitle || null };
    if (editingLoc) {
      await supabase.from("featured_locations").update(payload).eq("id", editingLoc.id);
      toast.success(t("admin.locationUpdated"));
    } else {
      await supabase.from("featured_locations").insert(payload);
      toast.success(t("admin.locationCreated"));
    }
    setLocDialog(false);
    fetchLocations();
  };
  const handleLocDelete = async (id: string) => {
    if (!confirm(t("admin.deleteLocationConfirm"))) return;
    await supabase.from("featured_locations").delete().eq("id", id);
    toast.success(t("admin.locationDeleted"));
    fetchLocations();
  };

  if (loading) {
    return <AdminLayout><p className="text-muted-foreground py-8">{t("admin.loading")}</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cms")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
      </div>

      <div className="space-y-8 max-w-4xl">
        {slug === "home" && <HomePageForm content={content} updateSection={updateSection} uploadImage={uploadImage} locations={locations} openLocCreate={openLocCreate} openLocEdit={openLocEdit} handleLocDelete={handleLocDelete} partners={partners} openPartnerCreate={openPartnerCreate} openPartnerEdit={openPartnerEdit} handlePartnerDelete={handlePartnerDelete} />}
        {slug === "agents" && <AgentsPageForm content={content} updateSection={updateSection} uploadImage={uploadImage} />}
        {slug === "terms" && <RichTextPageForm content={content} updateNestedField={updateNestedField} sectionTitle="For Users" />}
        {slug === "privacy" && <RichTextPageForm content={content} updateNestedField={updateNestedField} sectionTitle="Data" />}
        {slug === "contact" && <ContactPageForm content={content} updateSection={updateSection} uploadImage={uploadImage} />}
        {slug === "advertise" && <ContactPageForm content={content} updateSection={updateSection} uploadImage={uploadImage} />}
        {slug === "property-request" && <PropertyRequestForm content={content} updateSection={updateSection} updateNestedField={updateNestedField} uploadImage={uploadImage} />}

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? t("admin.saving") : t("admin.save")}
        </Button>
      </div>

      {/* Featured Location Dialog */}
      <Dialog open={locDialog} onOpenChange={setLocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLoc ? t("admin.editFeaturedLocation") : t("admin.createFeaturedLocation")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <input ref={locFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setLocImageFile(f); setLocImagePreview(URL.createObjectURL(f)); }
              }} />
            <ImageUploadBox preview={locImagePreview} onClick={() => locFileRef.current?.click()} height="h-40" />
            <div>
              <Label>{t("admin.name")}</Label>
              <Input value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Tagline <span className="text-muted-foreground text-xs">(thin text, e.g. "Explore")</span></Label>
              <Input value={locForm.tagline} onChange={(e) => setLocForm({ ...locForm, tagline: e.target.value })} placeholder="Explore" />
            </div>
            <div>
              <Label>Subtitle <span className="text-muted-foreground text-xs">(bold text, e.g. "Projects in Dubai")</span></Label>
              <Input value={locForm.subtitle} onChange={(e) => setLocForm({ ...locForm, subtitle: e.target.value })} placeholder="Projects in Dubai" />
            </div>
            <div>
              <Label>{t("admin.link")}</Label>
              <Input value={locForm.link_url} onChange={(e) => setLocForm({ ...locForm, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setLocDialog(false)}>{t("admin.cancel")}</Button>
              <Button className="flex-1" onClick={handleLocSave}>{editingLoc ? t("admin.update") : t("admin.create")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Partner Dialog */}
      <Dialog open={partnerDialog} onOpenChange={setPartnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPartner ? t("admin.editPartner") : t("admin.createPartner")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <input ref={partnerFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setPartnerImageFile(f); setPartnerImagePreview(URL.createObjectURL(f)); }
              }} />
            <ImageUploadBox preview={partnerImagePreview} onClick={() => partnerFileRef.current?.click()} height="h-28" label="Logo" />
            <div>
              <Label>{t("admin.name")}</Label>
              <Input value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} />
            </div>
            <div>
              <Label>{t("admin.linkUrl")}</Label>
              <Input value={partnerForm.link_url} onChange={(e) => setPartnerForm({ ...partnerForm, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPartnerDialog(false)}>{t("admin.cancel")}</Button>
              <Button className="flex-1" onClick={handlePartnerSave}>{editingPartner ? t("admin.update") : t("admin.create")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

/* ============ Shared Components ============ */

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-muted/30 border border-border rounded-xl p-6">
    <h2 className="text-lg font-bold text-foreground mb-1">{title}</h2>
    {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </div>
);

const ImageUploadBox = ({ preview, onClick, height = "h-40", label }: { preview: string | null; onClick: () => void; height?: string; label?: string }) => {
  const { t: tr } = useTranslation();
  return (
    <div>
      {label && <Label className="mb-1 block">{label}</Label>}
      <div
        onClick={onClick}
        className={`border-2 border-dashed border-border rounded-lg ${height} flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-muted-foreground text-sm">
            <ImageIcon className="h-8 w-8 mx-auto mb-1" />
            {tr("admin.clickToUpload")}
          </div>
        )}
      </div>
    </div>
  );
};

function useImageUploader(uploadImage: (file: File, folder: string) => Promise<string | null>) {
  const ref = useRef<HTMLInputElement>(null);
  const createHandler = (folder: string, onUrl: (url: string) => void) => {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadImage(file, folder);
      if (url) onUrl(url);
    };
  };
  return { ref, createHandler };
}

/* ============ Home Page Form ============ */

const HomePageForm = ({ content, updateSection, uploadImage, locations, openLocCreate, openLocEdit, handleLocDelete, partners: partnerItems, openPartnerCreate, openPartnerEdit, handlePartnerDelete }: any) => {
  const { t } = useTranslation();
  const hero = content.hero || {};
  const secondBanner = content.second_banner || {};
  const featProps = content.featured_properties || {};
  const featProjects = content.featured_projects || {};
  const featLocs = content.featured_locations || {};
  const partnersContent = content.partners || {};

  const bannerRef = useRef<HTMLInputElement>(null);

  const heroSlideRef = useRef<HTMLInputElement>(null);
  const heroImages: string[] = hero.hero_images || (hero.image_url ? [hero.image_url] : []);

  const addHeroImage = async (file: File) => {
    const url = await uploadImage(file, "hero");
    if (url) {
      const updated = [...heroImages, url];
      updateSection("hero", "hero_images", updated);
      // keep image_url synced to first image for backward compat
      if (updated.length === 1) updateSection("hero", "image_url", url);
    }
  };

  const removeHeroImage = (idx: number) => {
    const updated = heroImages.filter((_, i) => i !== idx);
    updateSection("hero", "hero_images", updated);
    updateSection("hero", "image_url", updated[0] || "");
  };

  return (
    <>
      <SectionCard title="Hero Slideshow" subtitle="Upload up to 5 images (2000px × 560px). Each slide has its own title, subtitle & link in 3 languages.">
        <input ref={heroSlideRef} type="file" accept="image/*" className="hidden"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) await addHeroImage(f); e.target.value = ''; }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {heroImages.map((url: string, idx: number) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-[21/9]">
              <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
              <button onClick={() => removeHeroImage(idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{idx + 1}</span>
            </div>
          ))}
          {heroImages.length < 5 && (
            <button onClick={() => heroSlideRef.current?.click()} className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border aspect-[21/9] hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground">
              <Plus className="h-5 w-5" />
              <span className="text-[10px] mt-1">Add Slide</span>
            </button>
          )}
        </div>

        {/* Per-slide content editor */}
        {heroImages.length > 0 && <HeroSlideEditor hero={hero} heroImages={heroImages} updateSection={updateSection} />}
      </SectionCard>

      <SectionCard title="Second Banner" subtitle="Advertising banner below hero">
        <input ref={bannerRef} type="file" accept="image/*" className="hidden"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "second_banner"); if (url) updateSection("second_banner", "image_url", url); } }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploadBox preview={secondBanner.image_url} onClick={() => bannerRef.current?.click()} height="h-32" />
          <div><Label>{t("admin.linkUrl")}</Label><Input value={secondBanner.link_url || ""} onChange={(e) => updateSection("second_banner", "link_url", e.target.value)} placeholder="https://..." /></div>
        </div>
      </SectionCard>

      <SectionCard title="Featured Properties">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Title</Label><Input value={featProps.title || ""} onChange={(e) => updateSection("featured_properties", "title", e.target.value)} /></div>
          <div><Label>Tagline</Label><Input value={featProps.tagline || ""} onChange={(e) => updateSection("featured_properties", "tagline", e.target.value)} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Featured Projects">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Title</Label><Input value={featProjects.title || ""} onChange={(e) => updateSection("featured_projects", "title", e.target.value)} /></div>
          <div><Label>Tagline</Label><Input value={featProjects.tagline || ""} onChange={(e) => updateSection("featured_projects", "tagline", e.target.value)} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Featured Locations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label>Title</Label><Input value={featLocs.title || ""} onChange={(e) => updateSection("featured_locations", "title", e.target.value)} /></div>
          <div><Label>Tagline</Label><Input value={featLocs.tagline || ""} onChange={(e) => updateSection("featured_locations", "tagline", e.target.value)} /></div>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Location Cards</p>
            <Button size="sm" onClick={openLocCreate} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Location</Button>
          </div>
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No featured locations yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {locations.map((loc: FeaturedLocation) => (
                <div key={loc.id} className="border border-border rounded-lg overflow-hidden bg-background">
                  {loc.image_url ? <img src={loc.image_url} alt={loc.name} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square bg-muted flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{loc.name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openLocEdit(loc)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleLocDelete(loc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Our Partners">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label>Title</Label><Input value={partnersContent.title || ""} onChange={(e) => updateSection("partners", "title", e.target.value)} /></div>
          <div><Label>Tagline</Label><Input value={partnersContent.tagline || ""} onChange={(e) => updateSection("partners", "tagline", e.target.value)} /></div>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Partner Logos</p>
            <Button size="sm" onClick={openPartnerCreate} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Partner</Button>
          </div>
          {partnerItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No partners yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {partnerItems.map((p: Partner) => (
                <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-background">
                  {p.logo_url ? <img src={p.logo_url} alt={p.name} className="w-full aspect-[3/2] object-contain p-2 bg-white" /> : <div className="w-full aspect-[3/2] bg-muted flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openPartnerEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handlePartnerDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </>
  );
};

/* ============ Hero Slide Editor with Language Tabs ============ */

const SLIDE_LANGS = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "fr", label: "Français", dir: "ltr" },
];

const HeroSlideEditor = ({ hero, heroImages, updateSection }: { hero: any; heroImages: string[]; updateSection: any }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeLang, setActiveLang] = useState("en");

  const slides: any[] = hero.slides || [];

  const getSlide = (idx: number) => slides[idx] || {};

  const updateSlide = (idx: number, field: string, value: string) => {
    const updated = [...slides];
    while (updated.length <= idx) updated.push({});
    updated[idx] = { ...updated[idx], [field]: value };
    updateSection("hero", "slides", updated);
  };

  const langSuffix = (lang: string, field: string) => {
    if (lang === "en") return field;
    return `${field}_${lang}`;
  };

  const currentSlide = getSlide(activeSlide);
  const dir = SLIDE_LANGS.find(l => l.code === activeLang)?.dir || "ltr";

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-4">
      <p className="text-sm font-medium text-foreground">Per-Slide Content</p>

      {/* Slide selector */}
      <div className="flex gap-2">
        {heroImages.map((_: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveSlide(idx)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeSlide === idx
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Slide {idx + 1}
          </button>
        ))}
      </div>

      {/* Language tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/50 w-fit">
        {SLIDE_LANGS.map(lang => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setActiveLang(lang.code)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeLang === lang.code
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Fields for active slide + language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Title ({activeLang.toUpperCase()})</Label>
          <Input
            dir={dir}
            value={currentSlide[langSuffix(activeLang, "title")] || ""}
            onChange={(e) => updateSlide(activeSlide, langSuffix(activeLang, "title"), e.target.value)}
            className={activeLang === "ar" ? "text-right font-arabic" : ""}
          />
        </div>
        <div>
          <Label>Subtitle ({activeLang.toUpperCase()})</Label>
          <Input
            dir={dir}
            value={currentSlide[langSuffix(activeLang, "subtitle")] || ""}
            onChange={(e) => updateSlide(activeSlide, langSuffix(activeLang, "subtitle"), e.target.value)}
            className={activeLang === "ar" ? "text-right font-arabic" : ""}
          />
        </div>
        <div>
          <Label>Link URL</Label>
          <Input
            value={currentSlide.link_url || ""}
            onChange={(e) => updateSlide(activeSlide, "link_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label>Link Button Text ({activeLang.toUpperCase()})</Label>
          <Input
            dir={dir}
            value={currentSlide[langSuffix(activeLang, "link_text")] || ""}
            onChange={(e) => updateSlide(activeSlide, langSuffix(activeLang, "link_text"), e.target.value)}
            className={activeLang === "ar" ? "text-right font-arabic" : ""}
          />
        </div>
      </div>
    </div>
  );
};

/* ============ Agents Page Form ============ */

const AgentsPageForm = ({ content, uploadImage, updateSection }: any) => {
  const hero = content.hero || {};
  const ref = useRef<HTMLInputElement>(null);

  return (
    <SectionCard title="Hero" subtitle="Bg (2000px × 560px)">
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "agents-hero"); if (url) updateSection("hero", "image_url", url); } }} />
      <ImageUploadBox preview={hero.image_url} onClick={() => ref.current?.click()} />
    </SectionCard>
  );
};

/* ============ Rich Text Page Form (Terms, Privacy) ============ */

const RichTextPageForm = ({ content, updateNestedField, sectionTitle }: any) => {
  const html = content?.content?.html || "";

  return (
    <SectionCard title={sectionTitle}>
      <Label>HTML Description</Label>
      <Textarea
        value={html}
        onChange={(e) => updateNestedField(["content", "html"], e.target.value)}
        rows={20}
        className="font-mono text-sm"
        placeholder="Enter HTML content..."
      />
    </SectionCard>
  );
};

/* ============ Contact / Advertise Page Form ============ */

const ContactPageForm = ({ content, updateSection, uploadImage }: any) => {
  const data = content.data || {};
  const ref = useRef<HTMLInputElement>(null);

  return (
    <SectionCard title="Data">
      <div className="space-y-4">
        <div><Label>Title</Label><Input value={data.title || ""} onChange={(e) => updateSection("data", "title", e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={data.description || ""} onChange={(e) => updateSection("data", "description", e.target.value)} rows={4} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <input ref={ref} type="file" accept="image/*" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "contact"); if (url) updateSection("data", "image_url", url); } }} />
            <ImageUploadBox preview={data.image_url} onClick={() => ref.current?.click()} label="Photo (636px × 500px)" />
          </div>
          <div><Label>TagLine</Label><Input value={data.tagline || ""} onChange={(e) => updateSection("data", "tagline", e.target.value)} /></div>
        </div>
      </div>
    </SectionCard>
  );
};

/* ============ Property Request Page Form ============ */

const PropertyRequestForm = ({ content, updateSection, updateNestedField, uploadImage }: any) => {
  const data = content.data || {};
  const steps = data.steps || [{}, {}, {}];
  const bgRef = useRef<HTMLInputElement>(null);
  const mainImgRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const stepRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  return (
    <>
      <SectionCard title="Data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div><Label>MainTitle</Label><Input value={data.main_title || ""} onChange={(e) => updateSection("data", "main_title", e.target.value)} /></div>
          <div>
            <input ref={bgRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "property-request"); if (url) updateSection("data", "bg_image_url", url); } }} />
            <ImageUploadBox preview={data.bg_image_url} onClick={() => bgRef.current?.click()} label="Bg (2000px × 450px)" height="h-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <input ref={mainImgRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "property-request"); if (url) updateSection("data", "main_image_url", url); } }} />
            <ImageUploadBox preview={data.main_image_url} onClick={() => mainImgRef.current?.click()} label="Image (1320px × 535px)" height="h-36" />
          </div>
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f, "property-request"); if (url) updateSection("data", "logo_image_url", url); } }} />
            <ImageUploadBox preview={data.logo_image_url} onClick={() => logoRef.current?.click()} label="Photo (146px × 47px)" height="h-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Label>Title</Label><Input value={data.title || ""} onChange={(e) => updateSection("data", "title", e.target.value)} /></div>
          <div><Label>Description1</Label><Input value={data.description1 || ""} onChange={(e) => updateSection("data", "description1", e.target.value)} /></div>
        </div>
        <div><Label>Description2</Label><Input value={data.description2 || ""} onChange={(e) => updateSection("data", "description2", e.target.value)} /></div>
      </SectionCard>

      <SectionCard title="Steps">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step: any, i: number) => (
            <div key={i} className="space-y-3">
              <input ref={stepRefs[i]} type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const url = await uploadImage(f, "property-request-steps");
                    if (url) {
                      const newSteps = [...steps];
                      newSteps[i] = { ...newSteps[i], image_url: url };
                      updateSection("data", "steps", newSteps);
                    }
                  }
                }} />
              <ImageUploadBox preview={step.image_url} onClick={() => stepRefs[i]?.current?.click()} label={`Image (84px × 84px)`} height="h-24" />
              <div><Label>Description</Label><Textarea value={step.description || ""} onChange={(e) => {
                const newSteps = [...steps];
                newSteps[i] = { ...newSteps[i], description: e.target.value };
                updateSection("data", "steps", newSteps);
              }} rows={3} /></div>
              <div><Label>Title</Label><Input value={step.title || ""} onChange={(e) => {
                const newSteps = [...steps];
                newSteps[i] = { ...newSteps[i], title: e.target.value };
                updateSection("data", "steps", newSteps);
              }} /></div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="SubTitle">
        <Input value={data.subtitle || ""} onChange={(e) => updateSection("data", "subtitle", e.target.value)} />
      </SectionCard>
    </>
  );
};

export default AdminCmsEditPage;

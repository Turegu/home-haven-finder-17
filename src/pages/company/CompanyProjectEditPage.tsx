import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Upload, X, ImageIcon, FileText } from "lucide-react";

const projectTypes = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "residential_compound", label: "Residential Compound" },
];
const projectStatuses = ["new", "under_construction", "ready", "off_plan", "completed"];
const provinces = ["Istanbul", "Ankara", "Antalya", "Izmir", "Bursa", "Adiyaman", "Mersin", "Mugla"];
const interiorAmenities = ["Central Heating", "Air Conditioning", "Elevator", "Smart Home", "Jacuzzi", "Sauna", "Fireplace", "Laundry Room"];
const exteriorAmenities = ["Swimming Pool", "Garden", "Garage", "Security", "Playground", "BBQ Area", "Tennis Court", "Gym", "Doorman"];

const CompanyProjectEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [planFiles, setPlanFiles] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingPlans, setUploadingPlans] = useState(false);

  const [form, setForm] = useState({
    title: "", tagline: "", description: "", developer: "",
    project_type: "residential", min_price: "", max_price: "",
    currency: "USD", min_units: "", max_units: "",
    min_area: "", max_area: "", area_unit: "m²",
    project_status: "new",
    interior_amenities: [] as string[],
    exterior_amenities: [] as string[],
    province: "", town: "", neighbourhood: "", pin_location: "",
    location: "", video_link: "", view_360_link: "",
  });

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleAmenity = (type: "interior_amenities" | "exterior_amenities", val: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].includes(val) ? prev[type].filter((a) => a !== val) : [...prev[type], val],
    }));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase.from("companies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Project not found"); return; }
      setForm({
        title: data.title || "", tagline: (data as any).tagline || "",
        description: data.description || "", developer: data.developer || "",
        project_type: data.project_type || "residential",
        min_price: data.min_price?.toString() || "", max_price: data.max_price?.toString() || "",
        currency: data.currency || "USD",
        min_units: data.min_units?.toString() || "", max_units: data.max_units?.toString() || "",
        min_area: (data as any).min_area?.toString() || "", max_area: (data as any).max_area?.toString() || "",
        area_unit: (data as any).area_unit || "m²",
        project_status: data.project_status || "new",
        interior_amenities: (data as any).interior_amenities || [],
        exterior_amenities: (data as any).exterior_amenities || [],
        province: (data as any).province || "", town: (data as any).town || "",
        neighbourhood: (data as any).neighbourhood || "", pin_location: (data as any).pin_location || "",
        location: data.location || "",
        video_link: (data as any).video_link || "", view_360_link: (data as any).view_360_link || "",
      });
      setImages(data.images || []);
      setPlanFiles((data as any).plans || []);
      setLogoUrl((data as any).logo_url || "");
      setPdfUrl((data as any).pdf_catalogue_url || "");
    };
    fetch();
  }, [isEdit, id]);

  const uploadFiles = async (files: FileList, bucket: string) => {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingImages(true);
    const urls = await uploadFiles(e.target.files, "project-images");
    setImages((prev) => [...prev, ...urls]);
    setUploadingImages(false);
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingPlans(true);
    const urls = await uploadFiles(e.target.files, "project-plans");
    setPlanFiles((prev) => [...prev, ...urls]);
    setUploadingPlans(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const urls = await uploadFiles(e.target.files, "project-logos");
    if (urls[0]) setLogoUrl(urls[0]);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const urls = await uploadFiles(e.target.files, "project-catalogues");
    if (urls[0]) setPdfUrl(urls[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { toast.error("Company not found"); return; }
    if (!form.title.trim()) { toast.error("Project name is required"); return; }
    setLoading(true);

    const payload: any = {
      title: form.title.trim(), description: form.description || null,
      tagline: form.tagline || null, developer: form.developer || null,
      project_type: form.project_type,
      min_price: form.min_price ? parseFloat(form.min_price) : null,
      max_price: form.max_price ? parseFloat(form.max_price) : null,
      currency: form.currency,
      min_units: form.min_units ? parseInt(form.min_units) : null,
      max_units: form.max_units ? parseInt(form.max_units) : null,
      min_area: form.min_area ? parseFloat(form.min_area) : null,
      max_area: form.max_area ? parseFloat(form.max_area) : null,
      area_unit: form.area_unit,
      project_status: form.project_status,
      interior_amenities: form.interior_amenities,
      exterior_amenities: form.exterior_amenities,
      province: form.province || null, town: form.town || null,
      neighbourhood: form.neighbourhood || null, pin_location: form.pin_location || null,
      location: form.location || null,
      video_link: form.video_link || null, view_360_link: form.view_360_link || null,
      images, plans: planFiles, logo_url: logoUrl || null,
      pdf_catalogue_url: pdfUrl || null, company_id: companyId,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("projects").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Project updated!");
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
        toast.success("Project created!");
      }
      navigate("/company/projects");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally { setLoading(false); }
  };

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{isEdit ? "Edit Project" : "New Project"}</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-10">
        {/* Description & Information */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Description & Information</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Project Name *</Label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="bg-secondary/50" required />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Project Tagline</Label>
                <Input value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Project Description</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[100px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Developer Name</Label>
                <Input value={form.developer} onChange={(e) => updateField("developer", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Project Type *</Label>
                <Select value={form.project_type} onValueChange={(v) => updateField("project_type", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{projectTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Starting Price ({form.currency})</Label>
                <Input type="number" value={form.min_price} onChange={(e) => updateField("min_price", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">No Of Units</Label>
                <Input type="number" value={form.min_units} onChange={(e) => updateField("min_units", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Min Area ({form.area_unit})</Label>
                <Input type="number" value={form.min_area} onChange={(e) => updateField("min_area", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Max Area ({form.area_unit})</Label>
                <Input type="number" value={form.max_area} onChange={(e) => updateField("max_area", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Project Status</Label>
                <Select value={form.project_status} onValueChange={(v) => updateField("project_status", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{projectStatuses.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Amenities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Exterior Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {exteriorAmenities.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity("exterior_amenities", a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.exterior_amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Interior Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {interiorAmenities.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity("interior_amenities", a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.interior_amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Province</Label>
              <Select value={form.province} onValueChange={(v) => updateField("province", v)}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select Province" /></SelectTrigger>
                <SelectContent>{provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">City/Town</Label>
              <Input value={form.town} onChange={(e) => updateField("town", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Neighbourhood</Label>
              <Input value={form.neighbourhood} onChange={(e) => updateField("neighbourhood", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Pin Location</Label>
              <Input value={form.pin_location} onChange={(e) => updateField("pin_location", e.target.value)} className="bg-secondary/50" placeholder="e.g. Istanbul, Turkey" />
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-border overflow-hidden bg-muted/50 h-[250px]">
            {form.pin_location ? (
              <iframe title="Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(form.pin_location)}&output=embed`} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Enter pin location to show map</div>
            )}
          </div>
        </section>

        {/* Media */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Media</h2>

          {/* Project Logo */}
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Project Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl && <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-border" />}
              <label className="px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                <Upload className="h-4 w-4 inline mr-2" />Upload Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages((p) => p.filter((u) => u !== url))}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">{uploadingImages ? "Uploading..." : "Browse"}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
              </label>
            </div>
          </div>

          {/* Plans */}
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Plans</Label>
            <div className="flex flex-wrap gap-3">
              {planFiles.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPlanFiles((p) => p.filter((u) => u !== url))}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">{uploadingPlans ? "Uploading..." : "Browse"}</span>
                <input type="file" accept="image/*" multiple onChange={handlePlanUpload} className="hidden" disabled={uploadingPlans} />
              </label>
            </div>
          </div>

          {/* Video, 360, PDF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Video Link</Label>
              <Input value={form.video_link} onChange={(e) => updateField("video_link", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">360 View Link</Label>
              <Input value={form.view_360_link} onChange={(e) => updateField("view_360_link", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Label className="text-foreground font-medium">PDF Catalogue</Label>
            <div className="flex items-center gap-4">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <FileText className="h-4 w-4" /> View PDF
                </a>
              )}
              <label className="px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                <Upload className="h-4 w-4 inline mr-2" />Choose File
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/company/projects")}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : isEdit ? "Update Project" : "Create"}
          </Button>
        </div>
      </form>
    </CompanyLayout>
  );
};

export default CompanyProjectEditPage;

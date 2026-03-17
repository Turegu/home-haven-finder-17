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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save, Upload, X } from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";

const eventTypes = [
  { value: "open_house", label: "Open House" },
  { value: "seminar_conference", label: "Seminar/Conference" },
  { value: "exhibition", label: "Exhibition" },
  { value: "auction", label: "Auction" },
  { value: "networking", label: "Networking Event" },
  { value: "workshop", label: "Workshop" },
  { value: "webinar", label: "Webinar" },
];



const CompanyEventEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "open_house",
    event_date: "",
    entry_type: "open_invitation" as "open_invitation" | "paid",
    price: "",
    currency: "USD",
    province: "",
    town: "",
    neighbourhood: "",
    pin_location: "",
    location: "",
    video_link: "",
    organizer: "",
  });

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchEvent = async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Event not found"); return; }
      const d = data as any;
      setForm({
        title: d.title || "",
        description: d.description || "",
        event_type: d.event_type || "open_house",
        event_date: d.event_date ? new Date(d.event_date).toISOString().slice(0, 16) : "",
        entry_type: d.entry_type || "open_invitation",
        price: d.price?.toString() || "",
        currency: d.currency || "USD",
        province: d.province || "",
        town: d.town || "",
        neighbourhood: d.neighbourhood || "",
        pin_location: d.pin_location || "",
        location: d.location || "",
        video_link: d.video_link || "",
        organizer: d.organizer || "",
      });
      setImages(d.images || []);
      setPdfUrl(d.pdf_catalogue_url || "");
    };
    fetchEvent();
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
    const urls = await uploadFiles(e.target.files, "event-images");
    setImages((prev) => [...prev, ...urls]);
    setUploadingImages(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const urls = await uploadFiles(e.target.files, "event-images");
    if (urls[0]) setPdfUrl(urls[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { toast.error("Company not found"); return; }
    if (!form.title.trim()) { toast.error("Event name is required"); return; }
    setLoading(true);

    const locationStr = [form.province, form.town, form.neighbourhood].filter(Boolean).join(", ");

    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      event_type: form.event_type,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      entry_type: form.entry_type,
      price: form.entry_type === "paid" && form.price ? parseFloat(form.price) : null,
      currency: form.currency,
      province: form.province || null,
      town: form.town || null,
      neighbourhood: form.neighbourhood || null,
      pin_location: form.pin_location || null,
      location: locationStr || form.location || null,
      video_link: form.video_link || null,
      pdf_catalogue_url: pdfUrl || null,
      organizer: form.organizer || null,
      images,
      company_id: companyId,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("events").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Event updated!");
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
        toast.success("Event created!");
      }
      navigate("/company/events");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally { setLoading(false); }
  };

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{isEdit ? "Edit Event" : "New Event"}</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-10">
        {/* Description & Information */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Description & Information</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Event Name *</Label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="bg-secondary/50" required placeholder="Event Title" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Organizer</Label>
                <Input value={form.organizer} onChange={(e) => updateField("organizer", e.target.value)} className="bg-secondary/50" placeholder="Organizer name" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Event Description</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[100px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Event Type *</Label>
                <Select value={form.event_type} onValueChange={(v) => updateField("event_type", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select Event Type" /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Event Date</Label>
                <Input type="datetime-local" value={form.event_date} onChange={(e) => updateField("event_date", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Entry Type */}
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Entry Type *</Label>
              <RadioGroup value={form.entry_type} onValueChange={(v) => updateField("entry_type", v)} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="open_invitation" id="entry_open" />
                  <Label htmlFor="entry_open" className="cursor-pointer text-sm">Open Invitation (Free)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="paid" id="entry_paid" />
                  <Label htmlFor="entry_paid" className="cursor-pointer text-sm">Paid Entry</Label>
                </div>
              </RadioGroup>
            </div>

            {form.entry_type === "paid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Entry Fee ({form.currency})</Label>
                  <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="bg-secondary/50" placeholder="Enter Price" min="0" step="0.01" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Location */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Province *</Label>
              <Select value={form.province} onValueChange={(v) => updateField("province", v)}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select The Province" /></SelectTrigger>
                <SelectContent>{provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">City/Town</Label>
              <Input value={form.town} onChange={(e) => updateField("town", e.target.value)} className="bg-secondary/50" placeholder="Select The Town" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Neighbourhood *</Label>
              <Input value={form.neighbourhood} onChange={(e) => updateField("neighbourhood", e.target.value)} className="bg-secondary/50" placeholder="Select The Neighbourhood" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Pin Location *</Label>
              <Input value={form.pin_location} onChange={(e) => updateField("pin_location", e.target.value)} className="bg-secondary/50" placeholder="Select The Location To Pin" />
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

          {/* Images */}
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Images *</Label>
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
              <label className="w-24 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                {uploadingImages ? (
                  <span className="text-xs text-muted-foreground">Uploading…</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Browse</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
              </label>
            </div>
          </div>

          {/* PDF Catalogue */}
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Attach PDF Catalogue</Label>
            <div className="flex items-center gap-4">
              {pdfUrl && (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border text-sm">
                  <span className="truncate max-w-[200px]">{pdfUrl.split("/").pop()}</span>
                  <button type="button" onClick={() => setPdfUrl("")} className="text-destructive"><X className="h-3 w-3" /></button>
                </div>
              )}
              <label className="px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                <Upload className="h-4 w-4 inline mr-2" />Choose File
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Video Link */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Video Link</Label>
            <Input value={form.video_link} onChange={(e) => updateField("video_link", e.target.value)} className="bg-secondary/50" placeholder="YouTube or video URL" />
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="px-8">
            <Save className="h-4 w-4 mr-2" /> {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/company/events")}>Cancel</Button>
        </div>
      </form>
    </CompanyLayout>
  );
};

export default CompanyEventEditPage;

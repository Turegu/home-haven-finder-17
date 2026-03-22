import { useState, useEffect } from "react";
import { useFieldValidation } from "@/hooks/useFieldValidation";
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
import {
  Save, Upload, X, FileText, ImageIcon, Compass, DollarSign,
  CalendarDays, Users, Video, Bold, Italic, Underline, List, Heading
} from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";
import PrePublishUpgradeDialog from "@/components/company/PrePublishUpgradeDialog";
import { getEventTypeIcon } from "@/data/eventTypes";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";

/* ─── Rich Text Toolbar ─── */
function RichTextToolbar({ onAction }: { onAction: (tag: string) => void }) {
  const buttons = [
    { tag: "bold", icon: Bold, tip: "Bold" },
    { tag: "italic", icon: Italic, tip: "Italic" },
    { tag: "underline", icon: Underline, tip: "Underline" },
    { tag: "bullet", icon: List, tip: "Bullet" },
    { tag: "heading", icon: Heading, tip: "Heading" },
  ];
  return (
    <div className="flex items-center gap-1 p-1 border border-border rounded-md bg-muted/30 w-fit">
      {buttons.map((b) => (
        <button
          key={b.tag} type="button" title={b.tip}
          onClick={() => onAction(b.tag)}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <b.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
    </div>
  );
}

/* ─── Reusable Form Select with Icon ─── */
function FormSelect({
  label, icon, value, onChange, options, placeholder, fieldName, error,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  fieldName?: string;
  error?: boolean;
}) {
  return (
    <div className="space-y-2" data-field={fieldName}>
      <Label className="text-foreground font-medium flex items-center gap-1.5">
        {icon} {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`bg-secondary/50 ${error ? "ring-2 ring-destructive/70" : ""}`}><SelectValue placeholder={placeholder || "Select"} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const CompanyEventEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const { options: filterOpts } = useFilterOptions("event");
  const eventTypes = (filterOpts["event_types"] || []).map(t => ({ value: t.toLowerCase().replace(/[\s\/]+/g, '_'), label: t }));
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const membershipLimits = useMembershipLimits(companyId);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { validate, clearError, errorClass } = useFieldValidation();

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "open_house",
    event_date: "",
    event_end_date: "",
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

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) {
        setCompanyId(company.id);
        const { data: agentData } = await supabase
          .from("agents").select("id, name").eq("company_id", company.id).eq("status", "active");
        setAgents(agentData || []);
      }
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
        event_end_date: d.event_end_date ? new Date(d.event_end_date).toISOString().slice(0, 16) : "",
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
      setLogoUrl(d.logo_url || "");
      setSelectedAgentId(d.agent_id || "");
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

  const validateEventForm = (): boolean => {
    if (!companyId) { toast.error("Company not found"); return false; }
    if (!isEdit && !membershipLimits.canCreate("events")) {
      toast.error(`Your ${membershipLimits.membership} membership does not allow more events. Please upgrade.`);
      return false;
    }
    const rules = [
      { field: "title", check: !form.title.trim(), message: "Event name is required" },
      { field: "event_type", check: !form.event_type, message: "Event type is required" },
      { field: "event_date", check: !form.event_date, message: "Event date is required" },
      ...(form.entry_type === "paid" ? [{ field: "price", check: !form.price, message: "Price is required for paid events" }] : []),
      { field: "province", check: !form.province, message: "Province is required" },
      { field: "town", check: !form.town, message: "Town/District is required" },
      { field: "neighbourhood", check: !form.neighbourhood, message: "Neighbourhood is required" },
    ];
    const valid = validate(rules);
    if (!valid) {
      const firstError = rules.find(r => r.check);
      if (firstError) toast.error(firstError.message);
    }
    return valid;
  };

  const handlePublishClick = () => {
    if (!validateEventForm()) return;
    setShowUpgradeDialog(true);
  };

  const handleSave = async (publishStatus: "draft" | "active") => {
    if (publishStatus === "active" && !validateEventForm()) return;
    if (publishStatus === "draft") {
      if (!companyId) { toast.error("Company not found"); return; }
      if (!form.title.trim()) { toast.error("Event name is required"); return; }
    }
    setLoading(true);

    const locationStr = [form.province, form.town, form.neighbourhood].filter(Boolean).join(", ");

    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      event_type: form.event_type,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      event_end_date: form.event_end_date ? new Date(form.event_end_date).toISOString() : null,
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
      logo_url: logoUrl || null,
      images,
      company_id: companyId,
      agent_id: selectedAgentId && selectedAgentId !== "none" ? selectedAgentId : null,
      status: publishStatus,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("events").update(payload).eq("id", id);
        if (error) throw error;
        toast.success(publishStatus === "active" ? "Event published!" : "Event saved as draft!");
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
        toast.success(publishStatus === "active" ? "Event published!" : "Event saved as draft!");
      }
      navigate("/company/events");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally { setLoading(false); }
  };

  const applyRichText = (tag: string) => {
    const el = document.getElementById("event-desc") as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form.description;
    const selected = text.substring(start, end);
    let wrapped = selected;
    if (tag === "bold") wrapped = `**${selected}**`;
    else if (tag === "italic") wrapped = `*${selected}*`;
    else if (tag === "underline") wrapped = `__${selected}__`;
    else if (tag === "bullet") wrapped = `\n- ${selected}`;
    else if (tag === "heading") wrapped = `\n### ${selected}`;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    updateField("description", newText);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + wrapped.length, start + wrapped.length); }, 0);
  };

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{isEdit ? "Edit Event" : "New Event"}</h1>

      <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl space-y-6 pb-10">

        {/* ─── Description & Information ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<FileText className="h-4 w-4" />} title="Description & Information" />
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2" data-field="title">
                <Label className="text-foreground font-medium">Event Name *</Label>
                <Input value={form.title} onChange={(e) => { if (e.target.value.length <= 60) updateField("title", e.target.value); }} className={`bg-secondary/50 ${errorClass("title")}`} required placeholder="Event Title" maxLength={60} />
                <p className="text-xs text-muted-foreground text-right">{form.title.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> Organizer
                </Label>
                <Input value={form.organizer} onChange={(e) => updateField("organizer", e.target.value)} className="bg-secondary/50" placeholder="Organizer name" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> Assign Agent
                </Label>
                <Select value={selectedAgentId || "none"} onValueChange={(v) => setSelectedAgentId(v === "none" ? "" : v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select an agent (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Agent</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Event Description</Label>
              <RichTextToolbar onAction={applyRichText} />
              <Textarea id="event-desc" value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[120px]" />
            </div>
          </div>
        </section>

        {/* ─── Event Details ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<CalendarDays className="h-4 w-4" />} title="Event Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormSelect
              label="Event Type *"
              icon={<CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />}
              value={form.event_type}
              onChange={(v) => updateField("event_type", v)}
              options={eventTypes.map((t) => ({ value: t.value, label: t.label }))}
              fieldName="event_type"
              error={errorClass("event_type") !== ""}
            />
            <div className="space-y-2" data-field="event_date">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Start Date & Time *
              </Label>
              <Input type="datetime-local" value={form.event_date} onChange={(e) => updateField("event_date", e.target.value)} className={`bg-secondary/50 ${errorClass("event_date")}`} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> End Date & Time
              </Label>
              <Input type="datetime-local" value={form.event_end_date} onChange={(e) => updateField("event_end_date", e.target.value)} className="bg-secondary/50" />
            </div>
            <FormSelect
              label="Currency"
              icon={<DollarSign className="h-3.5 w-3.5 text-muted-foreground" />}
              value={form.currency}
              onChange={(v) => updateField("currency", v)}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "EUR", label: "EUR (€)" },
                { value: "TRY", label: "TRY (₺)" },
                { value: "GBP", label: "GBP (£)" },
              ]}
            />
          </div>

          {/* Entry Type */}
          <div className="mt-5 space-y-3">
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
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Entry Fee ({form.currency})
                </Label>
                <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="bg-secondary/50" placeholder="Enter Price" min="0" step="0.01" />
              </div>
            </div>
          )}
        </section>

        {/* ─── Location ─── */}
        <section className="bg-card rounded-xl border border-border p-6" data-field="province">
          <SectionHeader icon={<Compass className="h-4 w-4" />} title="Location *" />
          <div className={`rounded-lg ${errorClass("province") || errorClass("town") || errorClass("neighbourhood") ? "ring-2 ring-destructive/70 p-2" : ""}`}>
          <LocationFormFields
            province={form.province}
            town={form.town}
            neighbourhood={form.neighbourhood}
            pinLocation={form.pin_location}
            onProvinceChange={(v) => { updateField("province", v); clearError("town"); clearError("neighbourhood"); }}
            onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)}
            onPinLocationChange={(v) => updateField("pin_location", v)}
          />
          </div>
        </section>

        {/* ─── Event Logo ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} title="Event Logo" />
          <p className="text-xs text-muted-foreground mb-4">Upload a custom logo for this event. If none is uploaded, a default logo based on the event type will be used.</p>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted/20">
              {logoUrl ? (
                <img src={logoUrl} alt="Event logo" className="w-full h-full object-contain p-1" />
              ) : (() => {
                const TypeIcon = getEventTypeIcon(form.event_type);
                return <TypeIcon className="h-8 w-8 text-foreground" />;
              })()}
              {logoUrl && (
                <button type="button" onClick={() => setLogoUrl("")}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div>
              <input type="file" accept="image/*" id="event-logo-upload" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !companyId) return;
                  setUploadingLogo(true);
                  const ext = file.name.split(".").pop();
                  const path = `${companyId}/logo-${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from("event-images").upload(path, file);
                  if (error) { toast.error("Upload failed"); setUploadingLogo(false); return; }
                  const { data } = supabase.storage.from("event-images").getPublicUrl(path);
                  setLogoUrl(data.publicUrl);
                  setUploadingLogo(false);
                  toast.success("Logo uploaded!");
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploadingLogo}
                onClick={() => document.getElementById("event-logo-upload")?.click()}>
                <Upload className="h-3 w-3 mr-1" /> {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Recommended: 200×200px</p>
            </div>
          </div>
        </section>

        {/* ─── Media ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} title="Media" />

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
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="truncate max-w-[200px]">{pdfUrl.split("/").pop()}</span>
                  <button type="button" onClick={() => setPdfUrl("")} className="text-destructive hover:opacity-70"><X className="h-3 w-3" /></button>
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
            <Label className="text-foreground font-medium flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-muted-foreground" /> Video Link
            </Label>
            <Input value={form.video_link} onChange={(e) => updateField("video_link", e.target.value)} className="bg-secondary/50" placeholder="YouTube or video URL" />
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/company/events")}>Cancel</Button>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => handleSave("draft")}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button type="button" disabled={loading} onClick={handlePublishClick}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Publishing..." : isEdit ? "Update & Publish" : "Publish"}
          </Button>
        </div>

        <PrePublishUpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          companyId={companyId || ""}
          listingId={isEdit ? (id as string || null) : null}
          listingTitle={form.title}
          listingType="event"
          onPublish={() => handleSave("active")}
        />
      </form>
    </CompanyLayout>
  );
};

export default CompanyEventEditPage;

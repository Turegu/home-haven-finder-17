import { useState, useEffect } from "react";
import { useFieldValidation } from "@/hooks/useFieldValidation";
import { useNavigate, useParams } from "react-router-dom";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Save, Upload, X, ImageIcon, FileText, Building2, Compass, DollarSign,
  Ruler, TreePine, Layers, Search, ChevronDown,
  Bold, Italic, Underline, List, Heading, Activity, Video,
  Plus, Trash2, Pencil, Package, Tag
} from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";
import defaultProjectLogo from "@/assets/default-project-logo.png";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";
import AmenitiesPickerDialog from "@/components/company/AmenitiesPickerDialog";
import SearchablePillSelect from "@/components/ui/searchable-pill-select";
import PrePublishUpgradeDialog from "@/components/company/PrePublishUpgradeDialog";

/* ─── Hardcoded arrays removed — now fetched dynamically via useFilterOptions ─── */

const advertisingTagOptions = [
  "Hot Deal", "Price Drop", "Exclusive", "New Launch", "Best Seller",
  "Limited Offer", "Negotiable", "Urgent Sale", "Last Chance",
  "Lower Price", "Below Market", "Reduced", "Cash Only",
  "Premium Location", "Sea View", "Investor Deal", "Move-In Ready",
  "Fully Renovated", "Motivated Seller", "Open House",
];

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

/* ─── Multi-Select Dropdown with Search ─── */
function MultiSelectDropdown({
  label, icon, options, selected, onToggle, searchable = false,
}: {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  searchable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = search ? options.filter(o => turkishIncludes(o, search)) : options;

  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center gap-1.5">{icon} {label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-secondary/50 font-normal text-sm">
            <span className="truncate">{selected.length ? `${selected.length} selected` : "Select..."}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
            </div>
          )}
          <div
            className="max-h-[280px] overflow-y-auto p-2 space-y-1"
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.preventDefault();
              e.stopPropagation();
              el.scrollTop += e.deltaY;
            }}
          >
            {filtered.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
                <Checkbox checked={selected.includes(opt)} onCheckedChange={() => onToggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs gap-1 pr-1">
              {s}
              <button type="button" onClick={() => onToggle(s)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
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

// Unit types and amenities now fetched dynamically via filterOpts

interface LocalPaymentStep {
  id: string;
  percentage: number;
  title: string;
  subtitle: string;
}

interface LocalPaymentPlan {
  id: string;
  plan_name: string;
  is_active: boolean;
  steps: LocalPaymentStep[];
}

interface UnitForm {
  unit_name: string;
  unit_type: string;
  rooms: string;
  bathrooms: string;
  car_parking: string;
  price: string;
  currency: string;
  area: string;
  area_unit: string;
  interior_amenities: string[];
  exterior_amenities: string[];
  advertising_tags: string[];
  images: string[];
  status: string;
  payment_plans: LocalPaymentPlan[];
}

const unitStatuses = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
];

const emptyUnit: UnitForm = {
  unit_name: "", unit_type: "apartment", rooms: "", bathrooms: "", car_parking: "",
  price: "", currency: "USD", area: "", area_unit: "m²",
  interior_amenities: [], exterior_amenities: [], advertising_tags: [], images: [], status: "available",
  payment_plans: [],
};

const CompanyProjectEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const { options: filterOpts } = useFilterOptions("project");
  const projectTypes = (filterOpts["project_types"] || []).map(t => ({ value: t, label: t }));
  const projectStatuses = filterOpts["project_statuses"] || [];
  const interiorAmenities = filterOpts["interior_amenities"] || [];
  const exteriorAmenities = filterOpts["exterior_amenities"] || [];
  const unitTypes = filterOpts["project_unit_types"] || [];
  const unitInteriorAmenities = interiorAmenities;
  const unitExteriorAmenities = exteriorAmenities;

  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const membershipLimits = useMembershipLimits(companyId);
  const [images, setImages] = useState<string[]>([]);
  const [planFiles, setPlanFiles] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [developerLogoUrl, setDeveloperLogoUrl] = useState("");
  const [isDifferentDeveloper, setIsDifferentDeveloper] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingPlans, setUploadingPlans] = useState(false);

  // Units state
  const [units, setUnits] = useState<any[]>([]);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState<UnitForm>({ ...emptyUnit });
  const [savingUnit, setSavingUnit] = useState(false);
  const [uploadingUnitImages, setUploadingUnitImages] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(isEdit ? (id as string) : null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { validate, clearError, errorClass } = useFieldValidation();

  const [form, setForm] = useState({
    title: "", tagline: "", description: "", developer: "",
    project_type: "residential", min_price: "", max_price: "",
    currency: "USD", min_units: "", max_units: "",
    min_area: "", max_area: "", area_unit: "m²",
    project_status: "new",
    interior_amenities: [] as string[],
    exterior_amenities: [] as string[],
    advertising_tags: [] as string[],
    property_classification: "",
    province: "", town: "", neighbourhood: "", pin_location: "",
    location: "", video_link: "", view_360_link: "",
  });

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

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
        advertising_tags: (data as any).advertising_tags || [],
        property_classification: (data as any).property_classification || "",
        province: (data as any).province || "", town: (data as any).town || "",
        neighbourhood: (data as any).neighbourhood || "", pin_location: (data as any).pin_location || "",
        location: data.location || "",
        video_link: (data as any).video_link || "", view_360_link: (data as any).view_360_link || "",
      });
      setImages(data.images || []);
      setPlanFiles((data as any).plans || []);
      setLogoUrl((data as any).logo_url || "");
      const devLogo = (data as any).developer_logo_url || "";
      setDeveloperLogoUrl(devLogo);
      setIsDifferentDeveloper(!!devLogo);
      setPdfUrl((data as any).pdf_catalogue_url || "");
      // Fetch units for existing project
      fetchUnits(id as string);
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

  const handleDeveloperLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const urls = await uploadFiles(e.target.files, "project-logos");
    if (urls[0]) setDeveloperLogoUrl(urls[0]);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const urls = await uploadFiles(e.target.files, "project-catalogues");
    if (urls[0]) setPdfUrl(urls[0]);
  };

  // ─── Units Management ───
  const fetchUnits = async (projId: string) => {
    const { data } = await supabase
      .from("project_units")
      .select("*")
      .eq("project_id", projId)
      .order("created_at", { ascending: true });
    setUnits(data || []);
  };

  const updateUnitField = (field: string, value: any) => setUnitForm((prev) => ({ ...prev, [field]: value }));

  const toggleUnitAmenity = (type: "interior_amenities" | "exterior_amenities", val: string) => {
    setUnitForm((prev) => ({
      ...prev,
      [type]: prev[type].includes(val) ? prev[type].filter((a) => a !== val) : [...prev[type], val],
    }));
  };

  const handleUnitImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingUnitImages(true);
    const urls = await uploadFiles(e.target.files, "project-images");
    setUnitForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    setUploadingUnitImages(false);
  };

  const openNewUnit = () => {
    setEditingUnitId(null);
    setUnitForm({ ...emptyUnit });
    setUnitDialogOpen(true);
  };

  const openEditUnit = async (unit: any) => {
    setEditingUnitId(unit.id);
    // Fetch existing payment plans for this unit
    let existingPlans: LocalPaymentPlan[] = [];
    const { data: plansData } = await supabase
      .from("unit_payment_plans")
      .select("*")
      .eq("unit_id", unit.id)
      .order("sort_order");
    if (plansData && plansData.length > 0) {
      const planIds = plansData.map((p: any) => p.id);
      const { data: stepsData } = await supabase
        .from("unit_payment_plan_steps")
        .select("*")
        .in("plan_id", planIds)
        .order("sort_order");
      existingPlans = plansData.map((p: any) => ({
        id: p.id,
        plan_name: p.plan_name,
        is_active: p.is_active,
        steps: (stepsData || []).filter((s: any) => s.plan_id === p.id).map((s: any) => ({
          id: s.id, percentage: s.percentage, title: s.title, subtitle: s.subtitle || "",
        })),
      }));
    }
    setUnitForm({
      unit_name: unit.unit_name || "", unit_type: unit.unit_type || "apartment",
      rooms: unit.rooms || "", bathrooms: unit.bathrooms?.toString() || "",
      car_parking: unit.car_parking?.toString() || "", price: unit.price?.toString() || "",
      currency: unit.currency || "USD", area: unit.area?.toString() || "",
      area_unit: unit.area_unit || "m²",
      interior_amenities: unit.interior_amenities || [],
      exterior_amenities: unit.exterior_amenities || [],
      advertising_tags: (unit as any).advertising_tags || [],
      images: unit.images || [],
      status: unit.status || "available",
      payment_plans: existingPlans,
    });
    setUnitDialogOpen(true);
  };

  const handleSubmitUnit = async () => {
    if (!unitForm.unit_name.trim()) { toast.error("Unit name is required"); return; }
    const projId = savedProjectId;
    if (!projId) { toast.error("Please save the project first before adding units"); return; }
    setSavingUnit(true);
    const payload: any = {
      unit_name: unitForm.unit_name.trim(), unit_type: unitForm.unit_type,
      rooms: unitForm.rooms || null,
      bathrooms: unitForm.bathrooms ? parseInt(unitForm.bathrooms) : null,
      car_parking: unitForm.car_parking ? parseInt(unitForm.car_parking) : null,
      price: unitForm.price ? parseFloat(unitForm.price) : null,
      currency: unitForm.currency, area: unitForm.area ? parseFloat(unitForm.area) : null,
      area_unit: unitForm.area_unit,
      interior_amenities: unitForm.interior_amenities,
      exterior_amenities: unitForm.exterior_amenities,
      advertising_tags: unitForm.advertising_tags,
      images: unitForm.images, project_id: projId, status: unitForm.status,
    };
    try {
      let unitId = editingUnitId;
      if (editingUnitId) {
        const { error } = await supabase.from("project_units").update(payload).eq("id", editingUnitId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("project_units").insert(payload).select("id").single();
        if (error) throw error;
        unitId = data.id;
      }

      // Save payment plans
      if (unitId && paymentPlans.length > 0) {
        for (let pi = 0; pi < paymentPlans.length; pi++) {
          const plan = paymentPlans[pi];
          const isExisting = !plan.id.startsWith("local-");
          let planId = plan.id;

          if (isExisting) {
            await supabase.from("unit_payment_plans").update({
              plan_name: plan.plan_name, is_active: plan.is_active, sort_order: pi,
            }).eq("id", planId);
            // Delete old steps and re-insert
            await supabase.from("unit_payment_plan_steps").delete().eq("plan_id", planId);
          } else {
            const { data: newPlan, error: planErr } = await supabase.from("unit_payment_plans").insert({
              unit_id: unitId, plan_name: plan.plan_name, is_active: plan.is_active, sort_order: pi,
            }).select("id").single();
            if (planErr) throw planErr;
            planId = newPlan.id;
          }

          if ((plan.steps ?? []).length > 0) {
            const stepsPayload = (plan.steps ?? []).map((s, si) => ({
              plan_id: planId, percentage: s.percentage, title: s.title,
              subtitle: s.subtitle || null, sort_order: si,
            }));
            await supabase.from("unit_payment_plan_steps").insert(stepsPayload);
          }
        }
      }

      // Delete plans that were removed (for editing)
      if (editingUnitId) {
        const { data: dbPlans } = await supabase.from("unit_payment_plans").select("id").eq("unit_id", editingUnitId);
        const keptIds = paymentPlans.filter(p => !p.id.startsWith("local-")).map(p => p.id);
        const toDelete = (dbPlans || []).filter((p: any) => !keptIds.includes(p.id));
        for (const d of toDelete) {
          await supabase.from("unit_payment_plan_steps").delete().eq("plan_id", d.id);
          await supabase.from("unit_payment_plans").delete().eq("id", d.id);
        }
      }

      toast.success(editingUnitId ? "Unit updated!" : "Unit added!");
      setUnitDialogOpen(false);
      fetchUnits(projId);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally { setSavingUnit(false); }
  };

  const handleDeleteUnit = async (unitId: string) => {
    const { error } = await supabase.from("project_units").delete().eq("id", unitId);
    if (error) toast.error("Delete failed");
    else { toast.success("Unit deleted"); if (savedProjectId) fetchUnits(savedProjectId); }
  };

  const unitStatusColor = (s: string) => {
    switch (s) { case "available": return "bg-emerald-100 text-emerald-800"; case "reserved": return "bg-orange-100 text-orange-800"; case "sold": return "bg-red-100 text-red-800"; default: return "bg-muted text-muted-foreground"; }
  };

  const validateProjectForm = (): boolean => {
    if (!companyId) { toast.error("Company not found"); return false; }
    if (!isEdit && !membershipLimits.canCreate("projects")) {
      toast.error(`Your ${membershipLimits.membership} membership does not allow more projects. Please upgrade.`);
      return false;
    }
    const rules = [
      { field: "title", check: !form.title.trim(), message: "Project name is required" },
      { field: "project_type", check: !form.project_type, message: "Project type is required" },
      { field: "project_status", check: !form.project_status, message: "Project status is required" },
      { field: "province", check: !form.province, message: "Province is required" },
      { field: "town", check: !form.town, message: "Town/District is required" },
      { field: "neighbourhood", check: !form.neighbourhood, message: "Neighbourhood is required" },
      { field: "min_price", check: !form.min_price && !form.max_price, message: "At least one price value is required" },
      { field: "min_area", check: !form.min_area && !form.max_area, message: "At least one area value is required" },
    ];
    const valid = validate(rules);
    if (!valid) {
      const firstError = rules.find(r => r.check);
      if (firstError) toast.error(firstError.message);
    }
    return valid;
  };

  const handlePublishClick = () => {
    if (!validateProjectForm()) return;
    setShowUpgradeDialog(true);
  };

  const handleSave = async (publishStatus: "draft" | "active", classificationOverride?: string) => {
    if (publishStatus === "active" && !validateProjectForm()) return;
    if (publishStatus === "draft") {
      if (!companyId) { toast.error("Company not found"); return; }
      if (!form.title.trim()) { toast.error("Project name is required"); return; }
    }

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
      advertising_tags: form.advertising_tags,
      property_classification: classificationOverride || form.property_classification || null,
      province: form.province || null, town: form.town || null,
      neighbourhood: form.neighbourhood || null, pin_location: form.pin_location || null,
      location: form.location || null,
      video_link: form.video_link || null, view_360_link: form.view_360_link || null,
      images, plans: planFiles, logo_url: logoUrl || null,
      developer_logo_url: isDifferentDeveloper ? (developerLogoUrl || null) : null,
      pdf_catalogue_url: pdfUrl || null, company_id: companyId,
      status: publishStatus,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("projects").update(payload).eq("id", id);
        if (error) throw error;
        toast.success(publishStatus === "active" ? "Project published!" : "Project saved as draft!");
      } else {
        const { data: inserted, error } = await supabase.from("projects").insert(payload).select("id").single();
        if (error) throw error;
        if (inserted) setSavedProjectId(inserted.id);
        toast.success(publishStatus === "active" ? "Project published!" : "Project saved as draft!");
      }
      navigate("/company/projects");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally { setLoading(false); }
  };

  const applyRichText = (tag: string) => {
    const el = document.getElementById("proj-desc") as HTMLTextAreaElement | null;
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

  const paymentPlans = unitForm.payment_plans ?? [];

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{isEdit ? "Edit Project" : "New Project"}</h1>

      <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl space-y-6 pb-10">

        {/* ─── Description & Information ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<FileText className="h-4 w-4" />} title="Description & Information" />
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2" data-field="title">
                <Label className="text-foreground font-medium">Project Name *</Label>
                <Input value={form.title} onChange={(e) => { if (e.target.value.length <= 20) updateField("title", e.target.value); }} className={`bg-secondary/50 ${errorClass("title")}`} required maxLength={20} />
                <p className="text-xs text-muted-foreground text-right">{form.title.length}/20 characters</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Project Tagline</Label>
                <Input value={form.tagline} onChange={(e) => { if (e.target.value.length <= 60) updateField("tagline", e.target.value); }} className="bg-secondary/50" maxLength={60} />
                <p className="text-xs text-muted-foreground text-right">{form.tagline.length}/60 characters</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Project Description</Label>
              <RichTextToolbar onAction={applyRichText} />
              <Textarea id="proj-desc" value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[120px]" />
            </div>
          </div>
        </section>

        {/* ─── Type & Status ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Building2 className="h-4 w-4" />} title="Type & Status" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormSelect
              label="Project Type *"
              icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
              value={form.project_type}
              onChange={(v) => updateField("project_type", v)}
              options={projectTypes.map((t) => ({ value: t.value, label: t.label }))}
            />
            <FormSelect
              label="Project Status"
              icon={<Activity className="h-3.5 w-3.5 text-muted-foreground" />}
              value={form.project_status}
              onChange={(v) => updateField("project_status", v)}
              options={projectStatuses.map((s) => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }))}
            />
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Developer Name
              </Label>
              <Input value={form.developer} onChange={(e) => updateField("developer", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* ─── Pricing & Size ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<DollarSign className="h-4 w-4" />} title="Pricing & Size" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Starting Price ({form.currency})
              </Label>
              <Input type="number" value={form.min_price} onChange={(e) => updateField("min_price", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Max Price ({form.currency})
              </Label>
              <Input type="number" value={form.max_price} onChange={(e) => updateField("max_price", e.target.value)} className="bg-secondary/50" />
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
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" /> No. Of Units
              </Label>
              <Input type="number" value={form.min_units} onChange={(e) => updateField("min_units", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" /> Min Area ({form.area_unit})
              </Label>
              <Input type="number" value={form.min_area} onChange={(e) => updateField("min_area", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" /> Max Area ({form.area_unit})
              </Label>
              <Input type="number" value={form.max_area} onChange={(e) => updateField("max_area", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* ─── Amenities ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<TreePine className="h-4 w-4" />} title="Amenities" />
          <AmenitiesPickerDialog
            interiorOptions={interiorAmenities}
            exteriorOptions={exteriorAmenities}
            selectedInterior={form.interior_amenities}
            selectedExterior={form.exterior_amenities}
            onToggleInterior={(val) => toggleAmenity("interior_amenities", val)}
            onToggleExterior={(val) => toggleAmenity("exterior_amenities", val)}
          />
        </section>

        {/* ─── Advertising Tags ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Tag className="h-4 w-4" />} title="Advertising Tags" />
          <p className="text-xs text-muted-foreground mb-3">Select preset tags or create your own (max 15 characters each)</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {advertisingTagOptions.map((tag) => (
              <button
                key={tag} type="button"
                onClick={() => updateField("advertising_tags", form.advertising_tags.includes(tag) ? form.advertising_tags.filter((t: string) => t !== tag) : [...form.advertising_tags, tag])}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.advertising_tags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                }`}
              >{tag}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Input
                id="proj-custom-tag-input"
                maxLength={15}
                placeholder="Type custom tag…"
                className="bg-secondary/50 pr-16 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const val = input.value.trim();
                    if (val && val.length <= 15 && !form.advertising_tags.includes(val)) {
                      updateField("advertising_tags", [...form.advertising_tags, val]);
                      input.value = "";
                    }
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">max 15</span>
            </div>
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => {
                const input = document.getElementById("proj-custom-tag-input") as HTMLInputElement;
                if (!input) return;
                const val = input.value.trim();
                if (val && val.length <= 15 && !form.advertising_tags.includes(val)) {
                  updateField("advertising_tags", [...form.advertising_tags, val]);
                  input.value = "";
                }
              }}
            >Add</Button>
          </div>
          {form.advertising_tags.filter((t: string) => !advertisingTagOptions.includes(t)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-1 self-center">Custom:</span>
              {form.advertising_tags.filter((t: string) => !advertisingTagOptions.includes(t)).map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {tag}
                  <button type="button" onClick={() => updateField("advertising_tags", form.advertising_tags.filter((t: string) => t !== tag))} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </section>


        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Compass className="h-4 w-4" />} title="Location" />
          <LocationFormFields
            province={form.province}
            town={form.town}
            neighbourhood={form.neighbourhood}
            pinLocation={form.pin_location}
            onProvinceChange={(v) => updateField("province", v)}
            onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)}
            onPinLocationChange={(v) => updateField("pin_location", v)}
          />
        </section>

        {/* ─── Media ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} title="Media" />

          {/* Project Logo */}
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Project Logo</Label>
            <div className="flex items-center gap-4">
              <img src={logoUrl || defaultProjectLogo} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-border" />
              <label className="px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                <Upload className="h-4 w-4 inline mr-2" />Upload Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Developer Logo */}
          <div className="space-y-3 mb-6 p-4 rounded-lg border border-border/60 bg-muted/30">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isDifferentDeveloper}
                onCheckedChange={(checked) => {
                  setIsDifferentDeveloper(!!checked);
                  if (!checked) setDeveloperLogoUrl("");
                }}
              />
              <Label className="text-foreground font-medium cursor-pointer" onClick={() => {
                setIsDifferentDeveloper(!isDifferentDeveloper);
                if (isDifferentDeveloper) setDeveloperLogoUrl("");
              }}>
                Developer is a different company
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Enable this if the project developer is different from your company. You can upload a separate logo for the developer.
            </p>
            {isDifferentDeveloper && (
              <div className="flex items-center gap-4 ml-7 mt-2">
                {developerLogoUrl ? (
                  <div className="relative">
                    <img src={developerLogoUrl} alt="Developer Logo" className="w-16 h-16 rounded-lg object-contain border border-border bg-white p-1" />
                    <button type="button" onClick={() => setDeveloperLogoUrl("")}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/50">
                    <Building2 className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <label className="px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 inline mr-2" />Upload Developer Logo
                  <input type="file" accept="image/*" onChange={handleDeveloperLogoUpload} className="hidden" />
                </label>
              </div>
            )}
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
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-muted-foreground" /> Video Link
              </Label>
              <Input value={form.video_link} onChange={(e) => updateField("video_link", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-muted-foreground" /> 360 View Link
              </Label>
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

        {/* ─── Units Management ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Project Units</h2>
            </div>
            <Button type="button" size="sm" onClick={openNewUnit} disabled={!isEdit && !savedProjectId}>
              <Plus className="h-4 w-4 mr-1" /> Add Unit
            </Button>
          </div>

          {!isEdit && !savedProjectId && (
            <p className="text-sm text-muted-foreground text-center py-4">Save the project first to start adding units.</p>
          )}

          {(isEdit || savedProjectId) && units.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No units yet. Click "Add Unit" to create one.</p>
          )}

          {units.length > 0 && (
            <div className="space-y-2">
              {units.map((unit) => (
                <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {unit.unit_type?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{unit.unit_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {unit.unit_type} {unit.rooms ? `· ${unit.rooms} rooms` : ""} {unit.price ? `· ${unit.currency} ${unit.price.toLocaleString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={unitStatusColor(unit.status)} variant="secondary">
                      {unit.status?.charAt(0).toUpperCase() + unit.status?.slice(1)}
                    </Badge>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUnit(unit)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteUnit(unit.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/company/projects")}>Cancel</Button>
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
          listingId={isEdit ? (id as string || null) : savedProjectId}
          listingTitle={form.title}
          listingType="project"
          onPublish={(classification) => handleSave("active", classification)}
        />

        {/* Unit Dialog */}
        <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUnitId ? "Edit Unit" : "Add Unit"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">Unit Name *</Label>
                  <Input value={unitForm.unit_name} onChange={(e) => updateUnitField("unit_name", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Unit Type</Label>
                  <Select value={unitForm.unit_type} onValueChange={(v) => updateUnitField("unit_type", v)}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>{unitTypes.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">No Of Rooms</Label>
                  <Input value={unitForm.rooms} onChange={(e) => updateUnitField("rooms", e.target.value)} className="bg-secondary/50" placeholder="e.g. 3+1" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">No Of Bathrooms</Label>
                  <Input type="number" value={unitForm.bathrooms} onChange={(e) => updateUnitField("bathrooms", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Car Parking</Label>
                  <Input type="number" value={unitForm.car_parking} onChange={(e) => updateUnitField("car_parking", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Unit Price ({unitForm.currency})</Label>
                  <Input type="number" value={unitForm.price} onChange={(e) => updateUnitField("price", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Area ({unitForm.area_unit})</Label>
                  <Input type="number" value={unitForm.area} onChange={(e) => updateUnitField("area", e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Status</Label>
                  <Select value={unitForm.status} onValueChange={(v) => updateUnitField("status", v)}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Unit Images */}
              <div className="space-y-2">
                <Label className="font-medium">Unit Images</Label>
                <div className="flex flex-wrap gap-3">
                  {unitForm.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setUnitForm((p) => ({ ...p, images: p.images.filter((u) => u !== url) }))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{uploadingUnitImages ? "..." : "Browse"}</span>
                    <input type="file" accept="image/*" multiple onChange={handleUnitImageUpload} className="hidden" disabled={uploadingUnitImages} />
                  </label>
                </div>
              </div>

              {/* Unit Amenities */}
              <div className="space-y-2">
                <Label className="font-medium">Amenities</Label>
                <AmenitiesPickerDialog
                  interiorOptions={unitInteriorAmenities}
                  exteriorOptions={unitExteriorAmenities}
                  selectedInterior={unitForm.interior_amenities}
                  selectedExterior={unitForm.exterior_amenities}
                  onToggleInterior={(a) => toggleUnitAmenity("interior_amenities", a)}
                  onToggleExterior={(a) => toggleUnitAmenity("exterior_amenities", a)}
                />
              </div>

              {/* Advertising Tags */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Advertising Tags
                </Label>
                <SearchablePillSelect
                  options={advertisingTagOptions}
                  selected={unitForm.advertising_tags}
                  onToggle={(tag) => updateUnitField("advertising_tags", unitForm.advertising_tags.includes(tag) ? unitForm.advertising_tags.filter(t => t !== tag) : [...unitForm.advertising_tags, tag])}
                  placeholder="Search tags..."
                />
              </div>

              {/* Inline Payment Plans */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-medium flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Payment Plans
                  </Label>
                  <Button
                    type="button" variant="outline" size="sm" className="h-7 text-xs"
                    onClick={() => {
                      setUnitForm(prev => ({
                        ...prev,
                        payment_plans: [...(prev.payment_plans ?? []), {
                          id: `local-${Date.now()}`,
                          plan_name: `Option ${(prev.payment_plans ?? []).length + 1}`,
                          is_active: true,
                          steps: [{ id: `ls-${Date.now()}`, percentage: 0, title: "", subtitle: "" }],
                        }],
                      }));
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Plan
                  </Button>
                </div>

                {paymentPlans.length === 0 && (
                  <p className="text-xs text-muted-foreground">No payment plans. Add one to show installment options.</p>
                )}

                {paymentPlans.map((plan, planIdx) => (
                  <div key={plan.id} className="border border-border rounded-lg bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={plan.plan_name}
                        onChange={(e) => {
                          const updated = [...(unitForm.payment_plans ?? [])];
                          updated[planIdx] = { ...updated[planIdx], plan_name: e.target.value };
                          setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                        }}
                        className="h-7 text-sm font-medium max-w-[180px] bg-secondary/50"
                      />
                      <label className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.is_active}
                          onChange={() => {
                            const updated = [...(unitForm.payment_plans ?? [])];
                            updated[planIdx] = { ...updated[planIdx], is_active: !plan.is_active };
                            setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                          }}
                          className="rounded"
                        />
                        Active
                      </label>
                      <Button
                        type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                        onClick={() => setUnitForm(prev => ({ ...prev, payment_plans: (prev.payment_plans ?? []).filter((_, i) => i !== planIdx) }))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {(plan.steps ?? []).map((step, stepIdx) => (
                      <div key={step.id} className="flex items-center gap-1.5">
                        <Input
                          type="number" placeholder="%" value={step.percentage || ""}
                          onChange={(e) => {
                            const updated = [...(unitForm.payment_plans ?? [])];
                            const steps = [...(updated[planIdx].steps ?? [])];
                            steps[stepIdx] = { ...steps[stepIdx], percentage: parseFloat(e.target.value) || 0 };
                            updated[planIdx] = { ...updated[planIdx], steps };
                            setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                          }}
                          className="h-7 text-xs w-16 bg-secondary/50 text-center"
                        />
                        <Input
                          placeholder="e.g. Down payment" value={step.title}
                          onChange={(e) => {
                            const updated = [...(unitForm.payment_plans ?? [])];
                            const steps = [...(updated[planIdx].steps ?? [])];
                            steps[stepIdx] = { ...steps[stepIdx], title: e.target.value };
                            updated[planIdx] = { ...updated[planIdx], steps };
                            setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                          }}
                          className="h-7 text-xs bg-secondary/50 flex-1"
                        />
                        <Input
                          placeholder="e.g. At signing" value={step.subtitle}
                          onChange={(e) => {
                            const updated = [...(unitForm.payment_plans ?? [])];
                            const steps = [...(updated[planIdx].steps ?? [])];
                            steps[stepIdx] = { ...steps[stepIdx], subtitle: e.target.value };
                            updated[planIdx] = { ...updated[planIdx], steps };
                            setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                          }}
                          className="h-7 text-xs bg-secondary/50 flex-1"
                        />
                        <Button
                          type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0"
                          onClick={() => {
                            const updated = [...(unitForm.payment_plans ?? [])];
                            updated[planIdx] = { ...updated[planIdx], steps: (updated[planIdx].steps ?? []).filter((_, i) => i !== stepIdx) };
                            setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button" variant="ghost" size="sm" className="h-6 text-xs"
                      onClick={() => {
                        const updated = [...(unitForm.payment_plans ?? [])];
                        updated[planIdx] = {
                          ...updated[planIdx],
                          steps: [...(updated[planIdx].steps ?? []), { id: `ls-${Date.now()}`, percentage: 0, title: "", subtitle: "" }],
                        };
                        setUnitForm(prev => ({ ...prev, payment_plans: updated }));
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Step
                    </Button>
                  </div>
                ))}
              </div>


              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleSubmitUnit} disabled={savingUnit}>
                  {savingUnit ? "Saving..." : editingUnitId ? "Update Unit" : "Add Unit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </CompanyLayout>
  );
};

export default CompanyProjectEditPage;

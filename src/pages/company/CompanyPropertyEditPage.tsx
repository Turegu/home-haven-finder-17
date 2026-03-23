import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { toast } from "sonner";
import {
  Save, Upload, X, ImageIcon, FileText, Building2, Home, Car, Sofa,
  Calendar, Compass, ScrollText, Activity, Tag, TreePine,
  DollarSign, Ruler, BedDouble, Bath, Layers, Clock, Search,
  ChevronDown, Bold, Italic, Underline, List, Heading, Plus, Trash2
} from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import AmenitiesPickerDialog from "@/components/company/AmenitiesPickerDialog";
import PrePublishUpgradeDialog from "@/components/company/PrePublishUpgradeDialog";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";

/* ─── Types ─── */
interface LocalPaymentPlanStep { id: string; percentage: number; title: string; subtitle: string; }
interface LocalPaymentPlan { id: string; plan_name: string; is_active: boolean; steps: LocalPaymentPlanStep[]; }

/* ─── Options aligned with front-end search filters ─── */

const contractTypesData = [
  { value: "residential_sale", labelKey: "companyDashboard.residentialForSale", purpose: "buy", classification: "residential" },
  { value: "residential_rent", labelKey: "companyDashboard.residentialForRent", purpose: "rent", classification: "residential" },
  { value: "commercial_sale", labelKey: "companyDashboard.commercialForSale", purpose: "buy", classification: "commercial" },
  { value: "commercial_rent", labelKey: "companyDashboard.commercialForRent", purpose: "rent", classification: "commercial" },
];

// Rent durations now fetched dynamically via filterOpts["rent_duration"]
const advertisingTagOptions = [
  "Hot Deal", "Price Drop", "Exclusive", "New Launch", "Best Seller",
  "Limited Offer", "Negotiable", "Urgent Sale", "Last Chance",
  "Lower Price", "Below Market", "Reduced", "Cash Only",
  "Premium Location", "Sea View", "Investor Deal", "Move-In Ready",
  "Fully Renovated", "Motivated Seller", "Open House",
];

const CompanyPropertyEditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const { options: filterOpts } = useFilterOptions("property");
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const membershipLimits = useMembershipLimits(companyId);
  const [images, setImages] = useState<string[]>([]);
  const [planFiles, setPlanFiles] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingPlans, setUploadingPlans] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { validate, clearError, errorClass } = useFieldValidation();
  const [paymentPlans, setPaymentPlans] = useState<LocalPaymentPlan[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    contract_type: "residential_sale",
    property_purpose: "buy",
    property_classification: "residential",
    rent_duration: "",
    property_type: "Apartment",
    price: "",
    area: "",
    area_unit: "m²",
    currency: "USD",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    floor_level: "",
    furniture: "",
    parking_spaces: "0",
    property_age: "",
    property_orientation: "",
    title_deed: "",
    property_status: "new",
    interior_amenities: [] as string[],
    exterior_amenities: [] as string[],
    advertising_tags: [] as string[],
    province: "",
    town: "",
    neighbourhood: "",
    pin_location: "",
    location: "",
    video_link: "",
    view_360_link: "",
    open_house_start: "",
    open_house_end: "",
  });

  const contractInfo = contractTypesData.find(c => c.value === form.contract_type);
  const isRent = contractInfo?.purpose === "rent";
  const isCommercial = contractInfo?.classification === "commercial";
  const residentialPropertyTypes = filterOpts["residential_property_types"] || [];
  const commercialPropertyTypes = filterOpts["commercial_property_types"] || [];
  const availablePropertyTypes = isCommercial ? commercialPropertyTypes : residentialPropertyTypes;

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleContractChange = (value: string) => {
    const info = contractTypesData.find(c => c.value === value);
    if (!info) return;
    const newTypes = info.classification === "commercial" ? commercialPropertyTypes : residentialPropertyTypes;
    setForm(prev => ({
      ...prev,
      contract_type: value,
      property_purpose: info.purpose,
      property_classification: info.classification,
      property_type: newTypes[0],
      rent_duration: info.purpose === "rent" ? prev.rent_duration : "",
    }));
  };

  const toggleArrayField = (field: "interior_amenities" | "exterior_amenities" | "advertising_tags", val: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter((a) => a !== val) : [...prev[field], val],
    }));
  };

  // Fetch company ID
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

  // Fetch existing property if editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchProperty = async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Property not found"); return; }

      // Derive contract_type from purpose + classification
      const purpose = data.property_purpose || "buy";
      const classification = (data as any).property_classification || "residential";
      let contractType = "residential_sale";
      if (classification === "commercial" && purpose === "rent") contractType = "commercial_rent";
      else if (classification === "commercial") contractType = "commercial_sale";
      else if (purpose === "rent") contractType = "residential_rent";

      setForm({
        title: data.title || "",
        description: data.description || "",
        contract_type: contractType,
        property_purpose: purpose,
        property_classification: classification,
        rent_duration: (data as any).rent_duration || "",
        property_type: data.property_type || "Apartment",
        price: data.price?.toString() || "",
        area: data.area?.toString() || "",
        area_unit: data.area_unit || "m²",
        currency: data.currency || "USD",
        rooms: (data as any).rooms || "",
        bedrooms: data.bedrooms?.toString() || "",
        bathrooms: data.bathrooms?.toString() || "",
        floor_level: (data as any).floor_level || "",
        furniture: (data as any).furniture || "",
        parking_spaces: (data as any).parking_spaces?.toString() || "0",
        property_age: (data as any).property_age || "",
        property_orientation: (data as any).property_orientation || "",
        title_deed: (data as any).title_deed || "",
        property_status: data.property_status || "new",
        interior_amenities: (data as any).interior_amenities || [],
        exterior_amenities: (data as any).exterior_amenities || [],
        advertising_tags: (data as any).advertising_tags || [],
        province: (data as any).province || "",
        town: (data as any).town || "",
        neighbourhood: (data as any).neighbourhood || "",
        pin_location: (data as any).pin_location || "",
        location: data.location || "",
        video_link: (data as any).video_link || "",
        view_360_link: (data as any).view_360_link || "",
        open_house_start: (data as any).open_house_start || "",
        open_house_end: (data as any).open_house_end || "",
      });
      setImages(data.images || []);
      setPlanFiles((data as any).plans || []);

      // Load payment plans
      const { data: plansData } = await supabase
        .from("property_payment_plans")
        .select("*")
        .eq("property_id", id)
        .order("sort_order");
      if (plansData && plansData.length > 0) {
        const planIds = plansData.map((p: any) => p.id);
        const { data: stepsData } = await supabase
          .from("property_payment_plan_steps")
          .select("*")
          .in("plan_id", planIds)
          .order("sort_order");
        setPaymentPlans(plansData.map((p: any) => ({
          id: p.id,
          plan_name: p.plan_name,
          is_active: p.is_active,
          steps: (stepsData || []).filter((s: any) => s.plan_id === p.id).map((s: any) => ({
            id: s.id, percentage: s.percentage, title: s.title, subtitle: s.subtitle || "",
          })),
        })));
      }
    };
    fetchProperty();
  }, [isEdit, id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setImages((prev) => [...prev, ...newUrls]);
    setUploadingImages(false);
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingPlans(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-plans").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("property-plans").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setPlanFiles((prev) => [...prev, ...newUrls]);
    setUploadingPlans(false);
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));
  const removePlan = (url: string) => setPlanFiles((prev) => prev.filter((u) => u !== url));

  const validateForm = (): boolean => {
    if (!companyId) { toast.error("Company not found"); return false; }
    if (!isEdit && !membershipLimits.canCreate("properties")) {
      toast.error(`Your ${membershipLimits.membership} membership does not allow more properties. Please upgrade your membership.`);
      return false;
    }
    const rules = [
      { field: "title", check: !form.title.trim(), message: "Title is required" },
      { field: "area", check: !form.area, message: "Area is required" },
      { field: "price", check: !form.price, message: "Price is required" },
      ...(isRent ? [{ field: "rent_duration", check: !form.rent_duration, message: "Rent duration is required" }] : []),
      { field: "rooms", check: !form.rooms, message: "Rooms selection is required" },
      { field: "bathrooms", check: !form.bathrooms, message: "Bathrooms is required" },
      { field: "floor_level", check: !form.floor_level, message: "Floor level is required" },
      { field: "furniture", check: !form.furniture, message: "Furniture status is required" },
      { field: "property_age", check: !form.property_age, message: "Property age is required" },
      { field: "property_orientation", check: !form.property_orientation, message: "Property orientation is required" },
      { field: "title_deed", check: !form.title_deed, message: "Title deed is required" },
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
    if (!validateForm()) return;
    setShowUpgradeDialog(true);
  };

  const handleSave = async (publishStatus: "draft" | "active", classificationOverride?: string) => {
    if (publishStatus === "active" && !validateForm()) return;
    if (publishStatus === "draft") {
      if (!companyId) { toast.error("Company not found"); return; }
      if (!form.title.trim()) { toast.error("Title is required"); return; }
    }
    setLoading(true);

    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      property_purpose: form.property_purpose,
      property_classification: classificationOverride || form.property_classification,
      rent_duration: isRent ? (form.rent_duration || null) : null,
      property_type: form.property_type,
      price: form.price ? parseFloat(form.price) : null,
      area: form.area ? parseFloat(form.area) : null,
      area_unit: form.area_unit,
      currency: form.currency,
      rooms: form.rooms || null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      floor_level: form.floor_level || null,
      furniture: form.furniture || null,
      parking_spaces: parseInt(form.parking_spaces) || 0,
      property_age: form.property_age || null,
      property_orientation: form.property_orientation || null,
      title_deed: form.title_deed || null,
      property_status: form.property_status,
      interior_amenities: form.interior_amenities,
      exterior_amenities: form.exterior_amenities,
      advertising_tags: form.advertising_tags,
      province: form.province || null,
      town: form.town || null,
      neighbourhood: form.neighbourhood || null,
      pin_location: form.pin_location || null,
      location: form.location || null,
      video_link: form.video_link || null,
      view_360_link: form.view_360_link || null,
      open_house_start: form.open_house_start || null,
      open_house_end: form.open_house_end || null,
      images,
      plans: planFiles,
      company_id: companyId,
      status: publishStatus,
    };

    try {
      let propertyId = id;
      if (isEdit) {
        const { error } = await supabase.from("properties").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("properties").insert(payload).select("id").single();
        if (error) throw error;
        propertyId = inserted.id;
      }

      // Save payment plans
      if (propertyId && paymentPlans.length > 0) {
        for (let pi = 0; pi < paymentPlans.length; pi++) {
          const plan = paymentPlans[pi];
          const isExisting = !plan.id.startsWith("local-");
          let planId = plan.id;

          if (isExisting) {
            await supabase.from("property_payment_plans").update({
              plan_name: plan.plan_name, is_active: plan.is_active, sort_order: pi,
            }).eq("id", planId);
            await supabase.from("property_payment_plan_steps").delete().eq("plan_id", planId);
          } else {
            const { data: newPlan, error: planErr } = await supabase.from("property_payment_plans").insert({
              property_id: propertyId, plan_name: plan.plan_name, is_active: plan.is_active, sort_order: pi,
            }).select("id").single();
            if (planErr) throw planErr;
            planId = newPlan.id;
          }

          if ((plan.steps ?? []).length > 0) {
            const stepsPayload = (plan.steps ?? []).map((s, si) => ({
              plan_id: planId, percentage: s.percentage, title: s.title,
              subtitle: s.subtitle || null, sort_order: si,
            }));
            await supabase.from("property_payment_plan_steps").insert(stepsPayload);
          }
        }
      }

      // Delete removed plans (for editing)
      if (isEdit && propertyId) {
        const { data: dbPlans } = await supabase.from("property_payment_plans").select("id").eq("property_id", propertyId);
        const keptIds = paymentPlans.filter(p => !p.id.startsWith("local-")).map(p => p.id);
        const toDelete = (dbPlans || []).filter((p: any) => !keptIds.includes(p.id));
        for (const d of toDelete) {
          await supabase.from("property_payment_plan_steps").delete().eq("plan_id", d.id);
          await supabase.from("property_payment_plans").delete().eq("id", d.id);
        }
      }

      toast.success(publishStatus === "active" ? "Property published!" : "Property saved as draft!");
      navigate("/company/properties");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {isEdit ? t("companyDashboard.editProperty") : t("companyDashboard.newProperty")}
      </h1>

      <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl space-y-6 pb-10">

        {/* ─── Basic Info ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{ t("companyDashboard.descriptionInfo") }</h2>
          </div>
          <div className="space-y-5">
            <div className="space-y-2" data-field="title">
              <Label className="text-foreground font-medium">{ t("companyDashboard.propertyTitle") + " *" }</Label>
              <Input value={form.title} onChange={(e) => { if (e.target.value.length <= 60) updateField("title", e.target.value); }} className={`bg-secondary/50 ${errorClass("title")}`} required maxLength={60} />
              <p className="text-xs text-muted-foreground text-right">{form.title.length}/60 {t("companyDashboard.characters")}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">{ t("companyDashboard.propertyDescription") }</Label>
              <RichTextToolbar
                onAction={(tag) => {
                  const el = document.getElementById("prop-desc") as HTMLTextAreaElement | null;
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
                }}
              />
              <Textarea id="prop-desc" value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[120px]" />
            </div>
          </div>
        </section>

        {/* ─── Contract & Type ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><ScrollText className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{ t("companyDashboard.contractPropertyType") }</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormSelect
              label={t("companyDashboard.contractType") + " *"}
              icon={<Home className="h-4 w-4 text-muted-foreground" />}
              value={form.contract_type}
              onChange={handleContractChange}
              options={contractTypesData.map(c => ({ value: c.value, label: t(c.labelKey) }))}
            />
            <FormSelect
              label={t("companyDashboard.propertyType") + " *"}
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              value={form.property_type}
              onChange={(v) => updateField("property_type", v)}
              options={availablePropertyTypes.map(pt => ({ value: pt, label: pt }))}
            />
          </div>
        </section>

        {/* ─── Pricing & Size ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><DollarSign className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{t("companyDashboard.pricingSize")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2" data-field="area">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                {t("companyDashboard.netArea")} ({form.area_unit}) *
              </Label>
              <Input type="number" value={form.area} onChange={(e) => updateField("area", e.target.value)} className={`bg-secondary/50 ${errorClass("area")}`} />
            </div>

            <div className="space-y-2" data-field="price">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                {isRent ? t("companyDashboard.rentPrice") : t("companyDashboard.price")} ({form.currency}) *
              </Label>
              <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} className={`bg-secondary/50 ${errorClass("price")}`} placeholder={isRent ? t("companyDashboard.enterRentPrice") : t("companyDashboard.enterPrice")} />
            </div>

            {isRent && (
              <FormSelect
                label={t("companyDashboard.rentalDuration") + " *"}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                value={form.rent_duration}
                onChange={(v) => updateField("rent_duration", v)}
                options={(filterOpts["rent_duration"] || []).map(d => ({ value: d, label: d }))}
                placeholder={t("companyDashboard.selectDuration")}
                fieldName="rent_duration"
                error={errorClass("rent_duration") !== ""}
              />
            )}
          </div>
        </section>

        {/* ─── Rooms & Features ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><BedDouble className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{ t("companyDashboard.propertyDetails") }</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormSelect
              label={t("companyDashboard.propertyStatus")}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              value={form.property_status}
              onChange={(v) => updateField("property_status", v)}
              options={(filterOpts["property_status"] || []).map(o => ({ value: o, label: o }))}
            />
            <FormSelect
              label={t("companyDashboard.noOfRooms") + " *"}
              icon={<BedDouble className="h-4 w-4 text-muted-foreground" />}
              value={form.rooms}
              onChange={(v) => updateField("rooms", v)}
              options={(filterOpts["rooms"] || []).map(r => ({ value: r, label: r }))}
              placeholder={t("companyDashboard.selectRooms")}
              fieldName="rooms"
              error={errorClass("rooms") !== ""}
            />
            <FormSelect
              label={t("companyDashboard.noOfBathrooms") + " *"}
              icon={<Bath className="h-4 w-4 text-muted-foreground" />}
              value={form.bathrooms}
              onChange={(v) => updateField("bathrooms", v)}
              options={(filterOpts["bathrooms"] || []).map(b => ({ value: b, label: b }))}
              placeholder={t("companyDashboard.selectBathrooms")}
              fieldName="bathrooms"
              error={errorClass("bathrooms") !== ""}
            />
            <FormSelect
              label={t("companyDashboard.floorLevel") + " *"}
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              value={form.floor_level}
              onChange={(v) => updateField("floor_level", v)}
              options={(filterOpts["floor_level"] || []).map(f => ({ value: f, label: f }))}
              placeholder={t("companyDashboard.selectFloor")}
              fieldName="floor_level"
              error={errorClass("floor_level") !== ""}
            />
            <FormSelect
              label={t("companyDashboard.furniture") + " *"}
              icon={<Sofa className="h-4 w-4 text-muted-foreground" />}
              value={form.furniture}
              onChange={(v) => updateField("furniture", v)}
              options={(filterOpts["furniture"] || []).map(f => ({ value: f, label: f }))}
              placeholder={t("companyDashboard.select")}
              fieldName="furniture"
              error={errorClass("furniture") !== ""}
            />
            <FormSelect
              label={t("companyDashboard.parking")}
              icon={<Car className="h-4 w-4 text-muted-foreground" />}
              value={form.parking_spaces}
              onChange={(v) => updateField("parking_spaces", v)}
              options={(filterOpts["parking"] || []).map(p => ({ value: p, label: p }))}
            />
            <FormSelect
              label={t("companyDashboard.propertyAge") + " *"}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              value={form.property_age}
              onChange={(v) => updateField("property_age", v)}
              options={(filterOpts["property_age"] || []).map(a => ({ value: a, label: a }))}
              placeholder={t("companyDashboard.select")}
              fieldName="property_age"
              error={errorClass("property_age") !== ""}
            />
            <FormSelect
              label="Orientation *"
              icon={<Compass className="h-4 w-4 text-muted-foreground" />}
              value={form.property_orientation}
              onChange={(v) => updateField("property_orientation", v)}
              options={(filterOpts["orientation"] || []).map(o => ({ value: o, label: o }))}
              placeholder="Select"
              fieldName="property_orientation"
              error={errorClass("property_orientation") !== ""}
            />
            <FormSelect
              label="Title Deed *"
              icon={<ScrollText className="h-4 w-4 text-muted-foreground" />}
              value={form.title_deed}
              onChange={(v) => updateField("title_deed", v)}
              options={(filterOpts["title_deed"] || []).map(t => ({ value: t, label: t }))}
              placeholder="Select"
              fieldName="title_deed"
              error={errorClass("title_deed") !== ""}
            />
          </div>
        </section>

        {/* ─── Amenities ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><TreePine className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{ t("companyDashboard.amenities") }</h2>
          </div>
          <AmenitiesPickerDialog
            interiorOptions={filterOpts["interior_amenities"] || []}
            exteriorOptions={filterOpts["exterior_amenities"] || []}
            selectedInterior={form.interior_amenities}
            selectedExterior={form.exterior_amenities}
            onToggleInterior={(val) => toggleArrayField("interior_amenities", val)}
            onToggleExterior={(val) => toggleArrayField("exterior_amenities", val)}
          />
        </section>

        {/* ─── Advertising Tags ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><Tag className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Advertising Tags</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Select preset tags or create your own (max 15 characters each)</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {advertisingTagOptions.map((tag) => (
              <button
                key={tag} type="button"
                onClick={() => toggleArrayField("advertising_tags", tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.advertising_tags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                }`}
              >{tag}</button>
            ))}
          </div>
          {/* Custom tag input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Input
                id="custom-tag-input"
                maxLength={15}
                placeholder="Type custom tag…"
                className="bg-secondary/50 pr-16 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const val = input.value.trim();
                    if (val && val.length <= 15 && !form.advertising_tags.includes(val)) {
                      toggleArrayField("advertising_tags", val);
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
                const input = document.getElementById("custom-tag-input") as HTMLInputElement;
                if (!input) return;
                const val = input.value.trim();
                if (val && val.length <= 15 && !form.advertising_tags.includes(val)) {
                  toggleArrayField("advertising_tags", val);
                  input.value = "";
                }
              }}
            >Add</Button>
          </div>
          {/* Show selected custom tags (not in presets) */}
          {form.advertising_tags.filter(t => !advertisingTagOptions.includes(t)).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-1 self-center">Custom:</span>
              {form.advertising_tags.filter(t => !advertisingTagOptions.includes(t)).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {tag}
                  <button type="button" onClick={() => toggleArrayField("advertising_tags", tag)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ─── Location ─── */}
        <section className="bg-card rounded-xl border border-border p-6" data-field="province">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><Compass className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{ t("companyDashboard.location") + " *" }</h2>
          </div>
          <div className={`rounded-lg ${errorClass("province") || errorClass("town") || errorClass("neighbourhood") ? "ring-2 ring-destructive/70 p-2" : ""}`}>
          <LocationFormFields
            province={form.province} town={form.town} neighbourhood={form.neighbourhood} pinLocation={form.pin_location}
            onProvinceChange={(v) => { updateField("province", v); clearError("town"); clearError("neighbourhood"); }} onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)} onPinLocationChange={(v) => updateField("pin_location", v)}
          />
          </div>
        </section>

        {/* ─── Media ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><ImageIcon className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">{ t("companyDashboard.media") }</h2>
          </div>
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="space-y-3 mb-6">
            <Label className="text-foreground font-medium">Plans</Label>
            <div className="flex flex-wrap gap-3">
              {planFiles.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePlan(url)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Video Link</Label>
              <Input value={form.video_link} onChange={(e) => updateField("video_link", e.target.value)} className="bg-secondary/50" placeholder="Enter Video Link" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">360 View Link</Label>
              <Input value={form.view_360_link} onChange={(e) => updateField("view_360_link", e.target.value)} className="bg-secondary/50" placeholder="Enter 360 View Link" />
            </div>
          </div>
        </section>

        {/* ─── Open House ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><Calendar className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Open House</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Starting Date And Time</Label>
              <Input type="datetime-local" value={form.open_house_start} onChange={(e) => updateField("open_house_start", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Ending Date And Time</Label>
              <Input type="datetime-local" value={form.open_house_end} onChange={(e) => updateField("open_house_end", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* ─── Payment Plans (Sale only) ─── */}
        {!isRent && (
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><DollarSign className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Payment Plans</h2>
            <Button
              type="button" variant="outline" size="sm" className="h-7 text-xs ml-auto"
              onClick={() => setPaymentPlans(prev => [...prev, {
                id: `local-${Date.now()}`,
                plan_name: `Option ${prev.length + 1}`,
                is_active: true,
                steps: [{ id: `ls-${Date.now()}`, percentage: 0, title: "", subtitle: "" }],
              }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Plan
            </Button>
          </div>

          {paymentPlans.length === 0 && (
            <p className="text-xs text-muted-foreground">No payment plans. Add one to show installment options on this property.</p>
          )}

          {paymentPlans.map((plan, planIdx) => (
            <div key={plan.id} className="border border-border rounded-lg bg-muted/20 p-3 space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <Input
                  value={plan.plan_name}
                  onChange={(e) => {
                    const updated = [...paymentPlans];
                    updated[planIdx] = { ...updated[planIdx], plan_name: e.target.value };
                    setPaymentPlans(updated);
                  }}
                  className="h-7 text-sm font-medium max-w-[180px] bg-secondary/50"
                />
                <label className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.is_active}
                    onChange={() => {
                      const updated = [...paymentPlans];
                      updated[planIdx] = { ...updated[planIdx], is_active: !plan.is_active };
                      setPaymentPlans(updated);
                    }}
                    className="rounded"
                  />
                  Active
                </label>
                <Button
                  type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                  onClick={() => setPaymentPlans(prev => prev.filter((_, i) => i !== planIdx))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {(plan.steps ?? []).map((step, stepIdx) => (
                <div key={step.id} className="flex items-center gap-1.5">
                  <Input
                    type="number" placeholder="%" value={step.percentage || ""}
                    onChange={(e) => {
                      const updated = [...paymentPlans];
                      const steps = [...(updated[planIdx].steps ?? [])];
                      steps[stepIdx] = { ...steps[stepIdx], percentage: parseFloat(e.target.value) || 0 };
                      updated[planIdx] = { ...updated[planIdx], steps };
                      setPaymentPlans(updated);
                    }}
                    className="h-7 text-xs w-16 bg-secondary/50 text-center"
                  />
                  <Input
                    placeholder="e.g. Down payment" value={step.title}
                    onChange={(e) => {
                      const updated = [...paymentPlans];
                      const steps = [...(updated[planIdx].steps ?? [])];
                      steps[stepIdx] = { ...steps[stepIdx], title: e.target.value };
                      updated[planIdx] = { ...updated[planIdx], steps };
                      setPaymentPlans(updated);
                    }}
                    className="h-7 text-xs bg-secondary/50 flex-1"
                  />
                  <Input
                    placeholder="e.g. At signing" value={step.subtitle}
                    onChange={(e) => {
                      const updated = [...paymentPlans];
                      const steps = [...(updated[planIdx].steps ?? [])];
                      steps[stepIdx] = { ...steps[stepIdx], subtitle: e.target.value };
                      updated[planIdx] = { ...updated[planIdx], steps };
                      setPaymentPlans(updated);
                    }}
                    className="h-7 text-xs bg-secondary/50 flex-1"
                  />
                  <Button
                    type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0"
                    onClick={() => {
                      const updated = [...paymentPlans];
                      updated[planIdx] = { ...updated[planIdx], steps: (updated[planIdx].steps ?? []).filter((_, i) => i !== stepIdx) };
                      setPaymentPlans(updated);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Button
                type="button" variant="ghost" size="sm" className="h-6 text-xs"
                onClick={() => {
                  const updated = [...paymentPlans];
                  updated[planIdx] = {
                    ...updated[planIdx],
                    steps: [...(updated[planIdx].steps ?? []), { id: `ls-${Date.now()}`, percentage: 0, title: "", subtitle: "" }],
                  };
                  setPaymentPlans(updated);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Step
              </Button>
            </div>
          ))}
        </section>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/company/properties")}>Cancel</Button>
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
          listingId={isEdit ? (id || null) : null}
          listingTitle={form.title}
          listingType="property"
          onPublish={(classification) => handleSave("active", classification)}
        />
      </form>
    </CompanyLayout>
  );
};

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
      <Label className="text-foreground font-medium flex items-center gap-1.5">
        {icon} {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-md border border-input bg-secondary/50 hover:border-primary/50 transition-colors text-left"
          >
            <span className={selected.length > 0 ? "text-foreground" : "text-muted-foreground"}>
              {selected.length > 0 ? `${selected.length} selected` : `Select ${label.toLowerCase()}`}
            </span>
            <div className="flex items-center gap-1.5">
              {selected.length > 0 && (
                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full">
                  {selected.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={6}>
          {searchable && (
            <div className="p-2.5 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search...`}
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
          <div
            className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5"
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.preventDefault();
              e.stopPropagation();
              el.scrollTop += e.deltaY;
            }}
          >
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">No results found</p>
            )}
            {filtered.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <label key={opt} className={`flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-md transition-colors ${isChecked ? "bg-primary/5" : "hover:bg-muted"}`}>
                  <Checkbox checked={isChecked} onCheckedChange={() => onToggle(opt)} />
                  <span className={`text-sm ${isChecked ? "text-foreground font-medium" : "text-foreground"}`}>{opt}</span>
                </label>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-primary">{selected.length}</span> selected
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─── Rich Text Toolbar ─── */
function RichTextToolbar({ onAction }: { onAction: (tag: string) => void }) {
  const buttons = [
    { tag: "bold", icon: Bold, label: "Bold" },
    { tag: "italic", icon: Italic, label: "Italic" },
    { tag: "underline", icon: Underline, label: "Underline" },
    { tag: "bullet", icon: List, label: "Bullet" },
    { tag: "heading", icon: Heading, label: "Heading" },
  ];
  return (
    <div className="flex items-center gap-1 p-1 border border-border rounded-md bg-muted/30 w-fit">
      {buttons.map((b) => (
        <button
          key={b.tag}
          type="button"
          onClick={() => onAction(b.tag)}
          title={b.label}
          className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <b.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export default CompanyPropertyEditPage;

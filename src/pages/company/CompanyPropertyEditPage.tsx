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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save, Upload, X, ImageIcon, FileText, Building2, Home, Car, Sofa,
  Calendar, Compass, ScrollText, Activity, Tag, TreePine, Lamp,
  DollarSign, Ruler, BedDouble, Bath, Layers, Clock, Search,
  ChevronDown, Bold, Italic, Underline, List, Heading
} from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";

/* ─── Options aligned with front-end search filters ─── */

const contractTypes = [
  { value: "residential_sale", label: "Residential for Sale", purpose: "buy", classification: "residential" },
  { value: "residential_rent", label: "Residential for Rent", purpose: "rent", classification: "residential" },
  { value: "commercial_sale", label: "Commercial for Sale", purpose: "buy", classification: "commercial" },
  { value: "commercial_rent", label: "Commercial for Rent", purpose: "rent", classification: "commercial" },
];

const residentialPropertyTypes = [
  "Apartment", "Villa", "Duplex", "Penthouse", "Townhouse", "Studio", "Land", "Farm House",
];
const commercialPropertyTypes = [
  "Office", "Shop", "Store", "Showroom", "Restaurant/Café", "Land", "Farms",
  "Labor Camp", "Factory", "Warehouse", "Co-Working Space", "Whole Building", "Full Floor",
];

const furnitureOptions = ["Fully Furnished", "Unfurnished", "Partially Furnished"];
const propertyStatusOptions = ["new", "under_construction", "ready", "resale"];
const ageOptions = ["New", "1-5 Years", "6-10 Years", "11-15 Years", "16-20 Years", "21+"];
const orientationOptions = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const titleDeedOptions = ["Freehold", "Leasehold", "Cooperative", "Other"];
const rentDurations = ["Daily", "Weekly", "Monthly", "Yearly"];
const advertisingTagOptions = [
  "Hot Deal", "Price Drop", "Exclusive", "New Launch", "Best Seller",
  "Limited Offer", "Negotiable", "Urgent Sale", "Last Chance",
  "Lower Price", "Below Market", "Reduced", "Cash Only",
  "Premium Location", "Sea View", "Investor Deal", "Move-In Ready",
  "Fully Renovated", "Motivated Seller", "Open House",
];

const floorLevels = [
  "Ground", "Garden floor", "1", "2", "3 - 5", "6 - 10",
  "10-20", "20+", "Top floor", "Basement", "Mezzanine", "Penthouse",
  "High entrance", "Semi Basement", "Direct entrance",
];
const parkingSpaces = ["0", "1", "2", "3", "4", "5", "6+"];

const interiorAmenities = [
  "Central heating", "Air conditioning", "Fireplace", "Built-in wardrobe",
  "Walk-in closet", "Kitchen appliances", "Laundry room", "Smart home system",
  "Jacuzzi", "Sauna", "Shower cabin", "Bathtub",
  "Generator", "Security Camera", "Security", "Card Access System",
  "Elevator", "Fire Lift", "Metal Detector",
];
const exteriorAmenities = [
  "Close to gym", "Close to the city center",
  "Close to restaurants and cafes", "Close to the beach",
  "Close to schools", "Close to a park", "Close to public transport",
  "Beach nearby", "Beachfront", "Private beach", "Beach access",
  "Swimming pool", "Garden", "Playground", "BBQ area",
];

const CompanyPropertyEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [planFiles, setPlanFiles] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingPlans, setUploadingPlans] = useState(false);

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

  const contractInfo = contractTypes.find(c => c.value === form.contract_type);
  const isRent = contractInfo?.purpose === "rent";
  const isCommercial = contractInfo?.classification === "commercial";
  const availablePropertyTypes = isCommercial ? commercialPropertyTypes : residentialPropertyTypes;

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleContractChange = (value: string) => {
    const info = contractTypes.find(c => c.value === value);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { toast.error("Company not found"); return; }
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);

    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      property_purpose: form.property_purpose,
      property_classification: form.property_classification,
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
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("properties").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Property updated!");
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;
        toast.success("Property created!");
      }
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
        {isEdit ? "Edit Property" : "New Property"}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-10">

        {/* ─── Basic Info ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Description & Information</h2>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Property Title *</Label>
              <Input value={form.title} onChange={(e) => { if (e.target.value.length <= 60) updateField("title", e.target.value); }} className="bg-secondary/50" required maxLength={60} />
              <p className="text-xs text-muted-foreground text-right">{form.title.length}/60 characters</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Property Description</Label>
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
            <h2 className="text-base font-semibold text-foreground tracking-tight">Contract & Property Type</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormSelect
              label="Contract Type *"
              icon={<Home className="h-4 w-4 text-muted-foreground" />}
              value={form.contract_type}
              onChange={handleContractChange}
              options={contractTypes.map(c => ({ value: c.value, label: c.label }))}
            />
            <FormSelect
              label="Property Type *"
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              value={form.property_type}
              onChange={(v) => updateField("property_type", v)}
              options={availablePropertyTypes.map(t => ({ value: t, label: t }))}
            />
          </div>
        </section>

        {/* ─── Pricing & Size ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><DollarSign className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Pricing & Size</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                Net Area ({form.area_unit})
              </Label>
              <Input type="number" value={form.area} onChange={(e) => updateField("area", e.target.value)} className="bg-secondary/50" />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                {isRent ? "Rent Price" : "Price"} ({form.currency})
              </Label>
              <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="bg-secondary/50" placeholder={isRent ? "Enter rent price" : "Enter price"} />
            </div>

            {isRent && (
              <FormSelect
                label="Rental Duration"
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                value={form.rent_duration}
                onChange={(v) => updateField("rent_duration", v)}
                options={rentDurations.map(d => ({ value: d, label: d }))}
                placeholder="Select duration"
              />
            )}
          </div>
        </section>

        {/* ─── Rooms & Features ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><BedDouble className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Rooms & Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormSelect
              label="Property Status"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              value={form.property_status}
              onChange={(v) => updateField("property_status", v)}
              options={propertyStatusOptions.map(o => ({ value: o, label: o.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) }))}
            />
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-muted-foreground" /> No. Of Rooms
              </Label>
              <Input value={form.rooms} onChange={(e) => updateField("rooms", e.target.value)} className="bg-secondary/50" placeholder="e.g. 3+1" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5 text-muted-foreground" /> No. Of Bathrooms
              </Label>
              <Input type="number" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} className="bg-secondary/50" />
            </div>
            <FormSelect
              label="Floor Level"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              value={form.floor_level}
              onChange={(v) => updateField("floor_level", v)}
              options={floorLevels.map(f => ({ value: f, label: f }))}
              placeholder="Select floor"
            />
            <FormSelect
              label="Furniture"
              icon={<Sofa className="h-4 w-4 text-muted-foreground" />}
              value={form.furniture}
              onChange={(v) => updateField("furniture", v)}
              options={furnitureOptions.map(f => ({ value: f, label: f }))}
              placeholder="Select"
            />
            <FormSelect
              label="Parking Spaces"
              icon={<Car className="h-4 w-4 text-muted-foreground" />}
              value={form.parking_spaces}
              onChange={(v) => updateField("parking_spaces", v)}
              options={parkingSpaces.map(p => ({ value: p, label: p }))}
            />
            <FormSelect
              label="Property Age"
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              value={form.property_age}
              onChange={(v) => updateField("property_age", v)}
              options={ageOptions.map(a => ({ value: a, label: a }))}
              placeholder="Select"
            />
            <FormSelect
              label="Orientation"
              icon={<Compass className="h-4 w-4 text-muted-foreground" />}
              value={form.property_orientation}
              onChange={(v) => updateField("property_orientation", v)}
              options={orientationOptions.map(o => ({ value: o, label: o }))}
              placeholder="Select"
            />
            <FormSelect
              label="Title Deed"
              icon={<ScrollText className="h-4 w-4 text-muted-foreground" />}
              value={form.title_deed}
              onChange={(v) => updateField("title_deed", v)}
              options={titleDeedOptions.map(t => ({ value: t, label: t }))}
              placeholder="Select"
            />
          </div>
        </section>

        {/* ─── Amenities (multi-select dropdowns) ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><TreePine className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Amenities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MultiSelectDropdown
              label="Interior Amenities"
              icon={<Lamp className="h-4 w-4 text-muted-foreground" />}
              options={interiorAmenities}
              selected={form.interior_amenities}
              onToggle={(val) => toggleArrayField("interior_amenities", val)}
              searchable
            />
            <MultiSelectDropdown
              label="Exterior Amenities"
              icon={<TreePine className="h-4 w-4 text-muted-foreground" />}
              options={exteriorAmenities}
              selected={form.exterior_amenities}
              onToggle={(val) => toggleArrayField("exterior_amenities", val)}
              searchable
            />
          </div>
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
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><Compass className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Location</h2>
          </div>
          <LocationFormFields
            province={form.province} town={form.town} neighbourhood={form.neighbourhood} pinLocation={form.pin_location}
            onProvinceChange={(v) => updateField("province", v)} onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)} onPinLocationChange={(v) => updateField("pin_location", v)}
          />
        </section>

        {/* ─── Media ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"><ImageIcon className="h-4 w-4" /></span>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Media</h2>
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
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">Open House</div>
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

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/company/properties")}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : isEdit ? "Update Property" : "Create"}
          </Button>
        </div>
      </form>
    </CompanyLayout>
  );
};

/* ─── Reusable Form Select with Icon ─── */
function FormSelect({
  label, icon, value, onChange, options, placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center gap-1.5">
        {icon} {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={placeholder || "Select"} /></SelectTrigger>
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
  const filtered = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;

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
          <ScrollArea className="max-h-[240px]">
            <div className="p-1.5 space-y-0.5">
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
          </ScrollArea>
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

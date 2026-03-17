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
import { Save, Upload, X, ImageIcon } from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";

const contractTypes = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
];

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "office", label: "Office" },
  { value: "land", label: "Land" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
  { value: "building", label: "Building" },
];

const classificationOptions = ["Luxury", "Standard", "Economy", "Commercial"];
const furnitureOptions = ["Furnished", "Semi-Furnished", "Unfurnished"];
const propertyStatusOptions = ["new", "under_construction", "ready", "resale"];
const ageOptions = ["0-1 Years", "1-5 Years", "5-10 Years", "10-20 Years", "20+ Years"];
const orientationOptions = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const titleDeedOptions = ["Freehold", "Leasehold", "Cooperative", "Other"];
const rentDurations = ["Monthly", "Yearly", "Daily"];


const interiorAmenities = ["Central Heating", "Air Conditioning", "Elevator", "Smart Home", "Jacuzzi", "Sauna", "Fireplace", "Walk-in Closet", "Laundry Room"];
const exteriorAmenities = ["Swimming Pool", "Garden", "Garage", "Security", "Playground", "BBQ Area", "Tennis Court", "Gym", "Doorman"];

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
    property_purpose: "buy",
    property_classification: "",
    rent_duration: "",
    property_type: "apartment",
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

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleAmenity = (type: "interior_amenities" | "exterior_amenities", val: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].includes(val) ? prev[type].filter((a) => a !== val) : [...prev[type], val],
    }));
  };

  // Fetch company ID
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  // Fetch existing property if editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchProperty = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Property not found");
        return;
      }
      setForm({
        title: data.title || "",
        description: data.description || "",
        property_purpose: data.property_purpose || "buy",
        property_classification: (data as any).property_classification || "",
        rent_duration: (data as any).rent_duration || "",
        property_type: data.property_type || "apartment",
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
      property_classification: form.property_classification || null,
      rent_duration: form.rent_duration || null,
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

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-10">
        {/* Description & Information */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">
            Description & Information
          </h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Property Title *</Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="bg-secondary/50" required />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Property Description</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[100px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Contract Type *</Label>
                <Select value={form.property_purpose} onValueChange={(v) => updateField("property_purpose", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Property Classification</Label>
                <Select value={form.property_classification} onValueChange={(v) => updateField("property_classification", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {classificationOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {form.property_purpose === "rent" && (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Rent Duration</Label>
                  <Select value={form.rent_duration} onValueChange={(v) => updateField("rent_duration", v)}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {rentDurations.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Property Type *</Label>
                <Select value={form.property_type} onValueChange={(v) => updateField("property_type", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Price ({form.currency})</Label>
                <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="bg-secondary/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Net Area ({form.area_unit})</Label>
                <Input type="number" value={form.area} onChange={(e) => updateField("area", e.target.value)} className="bg-secondary/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">No. Of Rooms</Label>
                <Input value={form.rooms} onChange={(e) => updateField("rooms", e.target.value)} className="bg-secondary/50" placeholder="e.g. 3+1" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">No. Of Bathrooms</Label>
                <Input type="number" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} className="bg-secondary/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Floor Level</Label>
                <Input value={form.floor_level} onChange={(e) => updateField("floor_level", e.target.value)} className="bg-secondary/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Furniture</Label>
                <Select value={form.furniture} onValueChange={(v) => updateField("furniture", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {furnitureOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Parking Spaces</Label>
                <Input type="number" value={form.parking_spaces} onChange={(e) => updateField("parking_spaces", e.target.value)} className="bg-secondary/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Property Age</Label>
                <Select value={form.property_age} onValueChange={(v) => updateField("property_age", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {ageOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Property Orientation</Label>
                <Select value={form.property_orientation} onValueChange={(v) => updateField("property_orientation", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {orientationOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Title Deed</Label>
                <Select value={form.title_deed} onValueChange={(v) => updateField("title_deed", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {titleDeedOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Property Status</Label>
                <Select value={form.property_status} onValueChange={(v) => updateField("property_status", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyStatusOptions.map((o) => <SelectItem key={o} value={o}>{o.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
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
              <Label className="text-foreground font-medium">Interior Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {interiorAmenities.map((a) => (
                  <button
                    key={a} type="button"
                    onClick={() => toggleAmenity("interior_amenities", a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.interior_amenities.includes(a)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                    }`}
                  >{a}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Exterior Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {exteriorAmenities.map((a) => (
                  <button
                    key={a} type="button"
                    onClick={() => toggleAmenity("exterior_amenities", a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.exterior_amenities.includes(a)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                    }`}
                  >{a}</button>
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

          {/* Map */}
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
            <Label className="text-foreground font-medium">Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)}
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
                  <button type="button" onClick={() => removePlan(url)}
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

          {/* Video & 360 */}
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

        {/* Open House */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Open House</h2>
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

export default CompanyPropertyEditPage;

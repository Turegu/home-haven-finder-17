import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Upload, X, ArrowLeft, Tag } from "lucide-react";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import UnitPaymentPlanManager from "@/components/company/UnitPaymentPlanManager";

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
}

const advertisingTagOptions = [
  "Hot Deal", "Price Drop", "Exclusive", "New Launch", "Best Seller",
  "Limited Offer", "Negotiable", "Urgent Sale", "Last Chance",
  "Lower Price", "Below Market", "Reduced", "Cash Only",
  "Premium Location", "Sea View", "Investor Deal", "Move-In Ready",
  "Fully Renovated", "Motivated Seller", "Open House",
];

const emptyUnit: UnitForm = {
  unit_name: "", unit_type: "apartment", rooms: "", bathrooms: "", car_parking: "",
  price: "", currency: "USD", area: "", area_unit: "m²",
  interior_amenities: [], exterior_amenities: [], advertising_tags: [], images: [],
};

const CompanyProjectUnitsPage = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { options: filterOpts } = useFilterOptions("project_unit");
  const unitTypes = filterOpts["project_unit_types"] || [];
  const interiorAmenities = filterOpts["interior_amenities"] || [];
  const exteriorAmenities = filterOpts["exterior_amenities"] || [];
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitForm>({ ...emptyUnit });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleAmenity = (type: "interior_amenities" | "exterior_amenities", val: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].includes(val) ? prev[type].filter((a) => a !== val) : [...prev[type], val],
    }));
  };

  const fetchUnits = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data: proj } = await supabase.from("projects").select("title").eq("id", projectId).maybeSingle();
    if (proj) setProjectTitle(proj.title);

    const { data, error } = await supabase
      .from("project_units")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (error) toast.error("Failed to load units");
    else setUnits(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUnits(); }, [projectId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split(".").pop();
      const path = `units/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("project-images").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("project-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    setUploading(false);
  };

  const openEdit = (unit: any) => {
    setEditingUnitId(unit.id);
    setForm({
      unit_name: unit.unit_name || "", unit_type: unit.unit_type || "apartment",
      rooms: unit.rooms || "", bathrooms: unit.bathrooms?.toString() || "",
      car_parking: unit.car_parking?.toString() || "", price: unit.price?.toString() || "",
      currency: unit.currency || "USD", area: unit.area?.toString() || "",
      area_unit: unit.area_unit || "m²",
      interior_amenities: unit.interior_amenities || [],
      exterior_amenities: unit.exterior_amenities || [],
      advertising_tags: (unit as any).advertising_tags || [],
      images: unit.images || [],
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingUnitId(null);
    setForm({ ...emptyUnit });
    setDialogOpen(true);
  };

  const handleSubmitUnit = async () => {
    if (!form.unit_name.trim()) { toast.error("Unit name is required"); return; }
    setSaving(true);
    const payload: any = {
      unit_name: form.unit_name.trim(), unit_type: form.unit_type,
      rooms: form.rooms || null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      car_parking: form.car_parking ? parseInt(form.car_parking) : null,
      price: form.price ? parseFloat(form.price) : null,
      currency: form.currency, area: form.area ? parseFloat(form.area) : null,
      area_unit: form.area_unit,
      interior_amenities: form.interior_amenities,
      exterior_amenities: form.exterior_amenities,
      advertising_tags: form.advertising_tags,
      images: form.images, project_id: projectId,
    };

    try {
      if (editingUnitId) {
        const { error } = await supabase.from("project_units").update(payload).eq("id", editingUnitId);
        if (error) throw error;
        toast.success("Unit updated!");
      } else {
        const { data, error } = await supabase.from("project_units").insert(payload).select("id").single();
        if (error) throw error;
        toast.success("Unit saved! You can now add payment plans below.");
        setEditingUnitId(data.id);
      }
      fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (unitId: string) => {
    const { error } = await supabase.from("project_units").delete().eq("id", unitId);
    if (error) toast.error("Delete failed");
    else { toast.success("Unit deleted"); fetchUnits(); }
  };

  const statusColor = (s: string) => {
    switch (s) { case "available": return "bg-emerald-100 text-emerald-800"; case "reserved": return "bg-orange-100 text-orange-800"; case "sold": return "bg-red-100 text-red-800"; default: return "bg-muted text-muted-foreground"; }
  };

  return (
    <CompanyLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/company/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Units</h1>
          {projectTitle && <p className="text-sm text-muted-foreground">{projectTitle}</p>}
        </div>
        <div className="ml-auto">
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Unit</Button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">Loading...</div>
        ) : units.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">No units yet. Click "Add Unit" to create one.</div>
        ) : (
          units.map((unit) => (
            <div key={unit.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Unit row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 grid grid-cols-8 gap-2 items-center text-sm">
                  <span className="font-medium text-foreground col-span-2">{unit.unit_name}</span>
                  <span className="capitalize text-muted-foreground">{unit.unit_type}</span>
                  <span className="text-muted-foreground">{unit.rooms || "—"}</span>
                  <span className="text-muted-foreground">{unit.bathrooms ?? "—"} bath</span>
                  <span className="text-muted-foreground">{unit.price ? `${unit.currency} ${unit.price.toLocaleString()}` : "—"}</span>
                  <span className="text-muted-foreground">{unit.area ? `${unit.area} ${unit.area_unit}` : "—"}</span>
                  <div>
                    <Badge className={statusColor(unit.status)} variant="secondary">
                      {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(unit)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(unit.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnitId ? "Edit Unit" : "Add Unit"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Unit Name *</Label>
                <Input value={form.unit_name} onChange={(e) => updateField("unit_name", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Unit Type</Label>
                <Select value={form.unit_type} onValueChange={(v) => updateField("unit_type", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{unitTypes.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">No Of Rooms</Label>
                <Select value={form.rooms} onValueChange={(v) => updateField("rooms", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select rooms" /></SelectTrigger>
                  <SelectContent>
                    {(filterOpts["rooms"] || []).map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">No Of Bathrooms</Label>
                <Select value={form.bathrooms} onValueChange={(v) => updateField("bathrooms", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select bathrooms" /></SelectTrigger>
                  <SelectContent>
                    {(filterOpts["bathrooms"] || []).map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Car Parking</Label>
                <Select value={form.car_parking} onValueChange={(v) => updateField("car_parking", v)}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select parking" /></SelectTrigger>
                  <SelectContent>
                    {(filterOpts["parking"] || []).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Unit Price ({form.currency})</Label>
                <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Area ({form.area_unit})</Label>
                <Input type="number" value={form.area} onChange={(e) => updateField("area", e.target.value)} className="bg-secondary/50" />
              </div>
            </div>

            {/* Unit Images */}
            <div className="space-y-2">
              <Label className="font-medium">Unit Images & Plans</Label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm((p) => ({ ...p, images: p.images.filter((u) => u !== url) }))}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{uploading ? "..." : "Browse"}</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Amenities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Exterior Amenities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {exteriorAmenities.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAmenity("exterior_amenities", a)}
                      className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${form.exterior_amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Interior Amenities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {interiorAmenities.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAmenity("interior_amenities", a)}
                      className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${form.interior_amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Plan — only after unit is saved */}
            {editingUnitId && (
              <div className="border-t border-border pt-4">
                <UnitPaymentPlanManager unitId={editingUnitId} unitName={form.unit_name} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitUnit} disabled={saving}>
                {saving ? (editingUnitId ? "Saving..." : "Save & Continue") : (editingUnitId ? "Update Unit" : "Save & Add Payment Plan")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CompanyLayout>
  );
};

export default CompanyProjectUnitsPage;

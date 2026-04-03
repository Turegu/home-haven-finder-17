import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { turkishIncludes } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Upload, Search, Trash2, MapPin, ChevronRight, Settings, Plus, X, Check, ChevronsUpDown, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia",
  "Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan",
  "Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

interface Location {
  id: string;
  province: string;
  province_ar: string | null;
  district: string;
  district_ar: string | null;
  neighborhood: string;
  neighborhood_ar: string | null;
  country: string;
  status: string;
}

interface LocationSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

const CountryCombobox = ({ value, onSelect }: { value: string; onSelect: (country: string) => void }) => {
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = search ? COUNTRIES.filter(c => turkishIncludes(c, search)) : COUNTRIES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between mt-1 font-normal">
          {value || tr("admin.selectCountry")}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b border-border">
          <Input placeholder={tr("admin.searchCountry")} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{tr("admin.noCountryFound")}</p>}
            {filtered.map(country => (
              <button key={country} onClick={() => { onSelect(country); setOpen(false); setSearch(""); }}
                className={cn("flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground", value === country && "bg-accent text-accent-foreground")}>
                <Check className={cn("h-4 w-4", value === country ? "opacity-100" : "opacity-0")} />{country}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default function AdminLocationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<Array<{ province: string; province_ar: string; district: string; district_ar: string; neighborhood: string; neighborhood_ar: string }> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({ province: "", province_ar: "", district: "", district_ar: "", neighborhood: "", neighborhood_ar: "" });

  // Edit states
  const [editingDistrict, setEditingDistrict] = useState<string | null>(null);
  const [editDistrictName, setEditDistrictName] = useState("");
  const [editDistrictAr, setEditDistrictAr] = useState("");
  const [editingNeighborhood, setEditingNeighborhood] = useState<string | null>(null);
  const [editNeighborhoodName, setEditNeighborhoodName] = useState("");
  const [editNeighborhoodAr, setEditNeighborhoodAr] = useState("");

  // Add district/neighborhood inline
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [newDistrictAr, setNewDistrictAr] = useState("");
  const [showAddNeighborhood, setShowAddNeighborhood] = useState(false);
  const [newNeighborhoodName, setNewNeighborhoodName] = useState("");
  const [newNeighborhoodAr, setNewNeighborhoodAr] = useState("");

  // Query: provinces
  const { data: provinces = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "provinces"],
    queryFn: async () => {
      const [rpcResult, countResult] = await Promise.all([
        supabase.rpc("get_distinct_provinces"),
        supabase.from("locations").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      if (countResult.count != null) setTotalCount(countResult.count);
      if (rpcResult.error) {
        console.error("Failed to load provinces:", rpcResult.error);
        const { data: fallback } = await supabase
          .from("locations")
          .select("province, province_ar")
          .eq("status", "active")
          .limit(1000);
        if (fallback) {
          const uniqueMap = new Map<string, string>();
          fallback.forEach((l) => uniqueMap.set(l.province, l.province_ar || ""));
          return Array.from(uniqueMap.entries()).map(([name, ar]) => ({ name, ar })).sort((a, b) => a.name.localeCompare(b.name));
        }
        return [];
      }
      return ((rpcResult.data || []) as { name: string; ar: string }[]).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 30_000,
  });

  // Query: districts (dependent on selectedProvince)
  const { data: districts = [] } = useQuery({
    queryKey: ["admin", "districts", selectedProvince],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_distinct_districts", { p_province: selectedProvince! });
      return ((data || []) as { name: string; ar: string }[]).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!selectedProvince,
    staleTime: 30_000,
  });

  // Query: settings
  const { data: settings = [] } = useQuery({
    queryKey: ["admin", "location-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("location_settings").select("*");
      return (data || []) as LocationSetting[];
    },
    staleTime: 30_000,
  });

  // Neighborhoods loaded imperatively (due to search + cascade)
  const loadNeighborhoods = useCallback(async (province: string, district: string) => {
    const { data } = await supabase
      .from("locations").select("*")
      .eq("province", province).eq("district", district).eq("status", "active")
      .order("neighborhood");
    if (data) setNeighborhoods(data as Location[]);
  }, []);

  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const q = searchQuery.trim();
    const { data } = await supabase.from("locations").select("*").eq("status", "active")
      .or(`province.ilike.%${q}%,district.ilike.%${q}%,neighborhood.ilike.%${q}%`).limit(100);
    if (data) { setNeighborhoods(data as Location[]); setSelectedProvince(null); setSelectedDistrict(null); }
    setSearching(false);
  };

  const invalidateProvinces = () => queryClient.invalidateQueries({ queryKey: ["admin", "provinces"] });
  const invalidateDistricts = () => queryClient.invalidateQueries({ queryKey: ["admin", "districts", selectedProvince] });
  const invalidateSettings = () => queryClient.invalidateQueries({ queryKey: ["admin", "location-settings"] });

  const handleDeleteNeighborhood = async (id: string) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) { toast.error(t("admin.deleteFailed")); return; }
    toast.success(t("admin.deleted"));
    if (selectedProvince && selectedDistrict) loadNeighborhoods(selectedProvince, selectedDistrict);
  };

  const handleDeleteDistrict = async (province: string, district: string) => {
    if (!confirm(`Delete ALL neighborhoods in ${district}, ${province}?`)) return;
    const { error } = await supabase.from("locations").delete().eq("province", province).eq("district", district);
    if (error) { toast.error(t("admin.deleteFailed")); return; }
    toast.success(`Deleted all in ${district}`);
    setSelectedDistrict(null); setNeighborhoods([]); invalidateDistricts();
  };

  const handleDeleteProvince = async (province: string) => {
    if (!confirm(`Delete ALL locations in ${province}? This cannot be undone.`)) return;
    const { error } = await supabase.from("locations").delete().eq("province", province);
    if (error) { toast.error(t("admin.deleteFailed")); return; }
    toast.success(`Deleted all in ${province}`);
    setSelectedProvince(null); setSelectedDistrict(null); setNeighborhoods([]); invalidateProvinces();
  };

  const handleSaveDistrictEdit = async (oldName: string) => {
    if (!editDistrictName.trim()) { toast.error(t("admin.districtRequired")); return; }
    const { error } = await supabase.from("locations")
      .update({ district: editDistrictName.trim(), district_ar: editDistrictAr.trim() || null })
      .eq("province", selectedProvince!).eq("district", oldName);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.districtUpdated"));
    setEditingDistrict(null);
    invalidateDistricts();
  };

  const handleAddDistrict = async () => {
    if (!newDistrictName.trim()) { toast.error(t("admin.districtRequired")); return; }
    const province = provinces.find(p => p.name === selectedProvince);
    const { error } = await supabase.from("locations").insert({
      province: selectedProvince!,
      province_ar: province?.ar || null,
      district: newDistrictName.trim(),
      district_ar: newDistrictAr.trim() || null,
      neighborhood: "(default)",
      neighborhood_ar: null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.districtAdded"));
    setShowAddDistrict(false); setNewDistrictName(""); setNewDistrictAr("");
    invalidateDistricts();
  };

  const handleSaveNeighborhoodEdit = async (id: string) => {
    if (!editNeighborhoodName.trim()) { toast.error(t("admin.neighborhoodRequired")); return; }
    const { error } = await supabase.from("locations")
      .update({ neighborhood: editNeighborhoodName.trim(), neighborhood_ar: editNeighborhoodAr.trim() || null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.neighborhoodUpdated"));
    setEditingNeighborhood(null);
    loadNeighborhoods(selectedProvince!, selectedDistrict!);
  };

  const handleAddNeighborhood = async () => {
    if (!newNeighborhoodName.trim()) { toast.error(t("admin.neighborhoodRequired")); return; }
    const province = provinces.find(p => p.name === selectedProvince);
    const district = districts.find(d => d.name === selectedDistrict);
    const { error } = await supabase.from("locations").insert({
      province: selectedProvince!,
      province_ar: province?.ar || null,
      district: selectedDistrict!,
      district_ar: district?.ar || null,
      neighborhood: newNeighborhoodName.trim(),
      neighborhood_ar: newNeighborhoodAr.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.neighborhoodAdded"));
    setShowAddNeighborhood(false); setNewNeighborhoodName(""); setNewNeighborhoodAr("");
    loadNeighborhoods(selectedProvince!, selectedDistrict!);
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("location_settings").update({ setting_value: value }).eq("setting_key", key);
    if (error) toast.error(t("admin.failedToUpdateSetting"));
    else { toast.success(t("admin.settingUpdated")); invalidateSettings(); }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      const data = rows.slice(1).filter((r) => r[0] && r[2] && r[4]).map((r) => ({
        province: String(r[0] || "").trim(), province_ar: String(r[1] || "").trim(),
        district: String(r[2] || "").trim(), district_ar: String(r[3] || "").trim(),
        neighborhood: String(r[4] || "").trim(), neighborhood_ar: String(r[5] || "").trim(),
      }));
      setUploadPreview(data);
      toast.info(`Parsed ${data.length} locations from Excel`);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleConfirmUpload = async (mode: "replace" | "merge") => {
    if (!uploadPreview) return;
    setUploading(true);
    try {
      if (mode === "replace") {
        await supabase.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
      const batchSize = 500;
      for (let i = 0; i < uploadPreview.length; i += batchSize) {
        const batch = uploadPreview.slice(i, i + batchSize);
        const { error } = await supabase.from("locations").insert(batch);
        if (error) { toast.error(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`); setUploading(false); return; }
      }
      toast.success(`Imported ${uploadPreview.length} locations`);
      setUploadPreview(null); setShowUpload(false); setSelectedProvince(null); setSelectedDistrict(null); setNeighborhoods([]); invalidateProvinces();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    setUploading(false);
  };

  const handleAddEntry = async () => {
    if (!newEntry.province || !newEntry.district || !newEntry.neighborhood) {
      toast.error(t("admin.provinceDistrictNeighRequired")); return;
    }
    const { error } = await supabase.from("locations").insert([newEntry]);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.locationAdded"));
    setShowAddDialog(false);
    setNewEntry({ province: "", province_ar: "", district: "", district_ar: "", neighborhood: "", neighborhood_ar: "" });
    invalidateProvinces();
    if (selectedProvince === newEntry.province && selectedDistrict === newEntry.district) {
      loadNeighborhoods(newEntry.province, newEntry.district);
    }
  };

  const allowedCountry = settings.find(s => s.setting_key === "allowed_country")?.setting_value || "Turkey";
  const maxSuggestions = settings.find(s => s.setting_key === "max_keyword_suggestions")?.setting_value || "10";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> {t("admin.locationManagement")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount.toLocaleString()} {t("admin.locationsAcrossProvinces")} {provinces.length} {t("admin.provinces")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-1" /> {t("admin.settings")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-1" /> {t("admin.importFromExcel")}
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t("admin.addLocation")}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input placeholder={t("admin.searchPlaceholder")} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="max-w-md" />
          <Button variant="outline" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
          {(selectedProvince || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setNeighborhoods([]); setSearchQuery(""); }}>
              <X className="h-4 w-4 mr-1" /> {t("admin.reset")}
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setNeighborhoods([]); }} className="hover:text-foreground">{t("admin.allProvinces")}</button>
          {selectedProvince && (
            <><ChevronRight className="h-3.5 w-3.5" />
              <button onClick={() => { setSelectedDistrict(null); setNeighborhoods([]); }} className="hover:text-foreground text-primary font-medium">{selectedProvince}</button></>
          )}
          {selectedDistrict && (
            <><ChevronRight className="h-3.5 w-3.5" /><span className="text-primary font-medium">{selectedDistrict}</span></>
          )}
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg border border-border">
          {(loading || searching) && !selectedProvince ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">{t("admin.loadingProvinces")}</div>
          ) : !selectedProvince && neighborhoods.length === 0 ? (
            /* Province list */
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-4">
                {provinces.filter(p => !searchQuery || turkishIncludes(p.name, searchQuery)).map((province) => (
                  <button key={province.name} onClick={() => setSelectedProvince(province.name)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{province.name}</span>
                      {province.ar && <span className="text-xs text-muted-foreground" dir="rtl">{province.ar}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProvince(province.name); }} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : selectedProvince && !selectedDistrict && neighborhoods.length === 0 ? (
            /* District list with edit/add */
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-sm font-medium text-muted-foreground">{districts.length} Districts in {selectedProvince}</span>
                <Button size="sm" variant="outline" onClick={() => setShowAddDistrict(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("admin.addDistrict")}
                </Button>
              </div>

              {/* Add district inline form */}
              {showAddDistrict && (
                <div className="mx-4 mt-2 p-3 border border-border rounded-lg bg-muted/30 flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">{t("admin.districtName")}</Label>
                    <Input value={newDistrictName} onChange={e => setNewDistrictName(e.target.value)} placeholder="e.g. Alanya" className="h-8 text-sm" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">{t("admin.arabicName")}</Label>
                    <Input value={newDistrictAr} onChange={e => setNewDistrictAr(e.target.value)} placeholder="ألانيا" dir="rtl" className="h-8 text-sm" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-8" onClick={handleAddDistrict}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddDistrict(false); setNewDistrictName(""); setNewDistrictAr(""); }}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[460px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-4">
                  {districts.map((district) => (
                    editingDistrict === district.name ? (
                      <div key={district.name} className="p-3 rounded-lg border border-primary bg-muted/30 space-y-2">
                        <Input value={editDistrictName} onChange={e => setEditDistrictName(e.target.value)} className="h-7 text-sm" placeholder="District name" />
                        <Input value={editDistrictAr} onChange={e => setEditDistrictAr(e.target.value)} className="h-7 text-sm" placeholder="Arabic" dir="rtl" />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleSaveDistrictEdit(district.name)}><Check className="h-3 w-3 mr-1" />{t("admin.save")}</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDistrict(null)}><X className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      <button key={district.name} onClick={() => setSelectedDistrict(district.name)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{district.name}</span>
                          {district.ar && <span className="text-xs text-muted-foreground" dir="rtl">{district.ar}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setEditingDistrict(district.name); setEditDistrictName(district.name); setEditDistrictAr(district.ar || ""); }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteDistrict(selectedProvince, district.name); }}
                            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    )
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            /* Neighborhood table with edit/add */
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-sm font-medium text-muted-foreground">{neighborhoods.length} Neighborhoods in {selectedDistrict}</span>
                {selectedProvince && selectedDistrict && (
                  <Button size="sm" variant="outline" onClick={() => setShowAddNeighborhood(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> {t("admin.addNeighborhood")}
                  </Button>
                )}
              </div>

              {showAddNeighborhood && (
                <div className="mx-4 mt-2 p-3 border border-border rounded-lg bg-muted/30 flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">{t("admin.neighborhoodName")}</Label>
                    <Input value={newNeighborhoodName} onChange={e => setNewNeighborhoodName(e.target.value)} placeholder="e.g. Kestel" className="h-8 text-sm" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">{t("admin.arabicName")}</Label>
                    <Input value={newNeighborhoodAr} onChange={e => setNewNeighborhoodAr(e.target.value)} placeholder="كستل" dir="rtl" className="h-8 text-sm" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-8" onClick={handleAddNeighborhood}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddNeighborhood(false); setNewNeighborhoodName(""); setNewNeighborhoodAr(""); }}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[460px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!selectedProvince && <TableHead>{t("admin.province")}</TableHead>}
                      {!selectedDistrict && <TableHead>{t("admin.district")}</TableHead>}
                      <TableHead>{t("admin.neighborhood")}</TableHead>
                      <TableHead>{t("admin.neighborhoodAr")}</TableHead>
                      <TableHead className="w-24">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {neighborhoods.map((loc) => (
                      editingNeighborhood === loc.id ? (
                        <TableRow key={loc.id}>
                          {!selectedProvince && <TableCell className="text-sm">{loc.province}</TableCell>}
                          {!selectedDistrict && <TableCell className="text-sm">{loc.district}</TableCell>}
                          <TableCell>
                            <Input value={editNeighborhoodName} onChange={e => setEditNeighborhoodName(e.target.value)} className="h-7 text-sm" />
                          </TableCell>
                          <TableCell>
                            <Input value={editNeighborhoodAr} onChange={e => setEditNeighborhoodAr(e.target.value)} className="h-7 text-sm" dir="rtl" />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveNeighborhoodEdit(loc.id)}><Check className="h-3.5 w-3.5 text-primary" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingNeighborhood(null)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={loc.id}>
                          {!selectedProvince && <TableCell className="text-sm">{loc.province}</TableCell>}
                          {!selectedDistrict && <TableCell className="text-sm">{loc.district}</TableCell>}
                          <TableCell className="text-sm font-medium">{loc.neighborhood}</TableCell>
                          <TableCell className="text-sm text-muted-foreground" dir="rtl">{loc.neighborhood_ar}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingNeighborhood(loc.id); setEditNeighborhoodName(loc.neighborhood); setEditNeighborhoodAr(loc.neighborhood_ar || ""); }}
                                className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteNeighborhood(loc.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    ))}
                    {neighborhoods.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("admin.noLocationsFound")}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.locationSettings")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t("admin.allowedCountry")}</Label>
                <CountryCombobox value={allowedCountry} onSelect={(country) => handleUpdateSetting("allowed_country", country)} />
                <p className="text-xs text-muted-foreground mt-1">{t("admin.allowedCountryHint")}</p>
              </div>
              <div>
                <Label>{t("admin.maxKeywordSuggestions")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input defaultValue={maxSuggestions} id="max_suggestions" type="number" min={1} max={50} />
                  <Button size="sm" onClick={() => {
                    const v = (document.getElementById("max_suggestions") as HTMLInputElement)?.value;
                    if (v) handleUpdateSetting("max_keyword_suggestions", v);
                  }}>{t("admin.save")}</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Excel Dialog */}
        <Dialog open={showUpload} onOpenChange={(o) => { setShowUpload(o); if (!o) setUploadPreview(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{t("admin.importLocationsExcel")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Excel format: <Badge variant="outline">Province</Badge> <Badge variant="outline">Province(ar)</Badge> <Badge variant="outline">District</Badge> <Badge variant="outline">District(ar)</Badge> <Badge variant="outline">Neighborhood</Badge> <Badge variant="outline">Neighborhood(ar)</Badge>
              </p>
              <Input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} />
              {uploadPreview && (
                <>
                  <div className="rounded border border-border p-3 bg-muted/50">
                    <p className="text-sm font-medium mb-2">{uploadPreview.length.toLocaleString()} locations parsed</p>
                    <p className="text-xs text-muted-foreground">
                      Provinces: {[...new Set(uploadPreview.map(r => r.province))].length} |
                      Districts: {[...new Set(uploadPreview.map(r => `${r.province}-${r.district}`))].length}
                    </p>
                    <ScrollArea className="h-[200px] mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">{t("admin.province")}</TableHead>
                            <TableHead className="text-xs" dir="rtl">Province (AR)</TableHead>
                            <TableHead className="text-xs">{t("admin.district")}</TableHead>
                            <TableHead className="text-xs" dir="rtl">District (AR)</TableHead>
                            <TableHead className="text-xs">{t("admin.neighborhood")}</TableHead>
                            <TableHead className="text-xs" dir="rtl">{t("admin.neighborhoodAr")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadPreview.slice(0, 20).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-1">{r.province}</TableCell>
                              <TableCell className="text-xs py-1" dir="rtl">{r.province_ar}</TableCell>
                              <TableCell className="text-xs py-1">{r.district}</TableCell>
                              <TableCell className="text-xs py-1" dir="rtl">{r.district_ar}</TableCell>
                              <TableCell className="text-xs py-1">{r.neighborhood}</TableCell>
                              <TableCell className="text-xs py-1" dir="rtl">{r.neighborhood_ar}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {uploadPreview.length > 20 && <p className="text-xs text-muted-foreground text-center mt-2">... and {uploadPreview.length - 20} more</p>}
                    </ScrollArea>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => handleConfirmUpload("merge")} disabled={uploading}>
                      {uploading ? t("admin.importing") : t("admin.mergeAddNew")}
                    </Button>
                    <Button variant="destructive" onClick={() => handleConfirmUpload("replace")} disabled={uploading}>
                      {uploading ? "Importing..." : "Replace All"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Location Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Location</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Province</Label><Input value={newEntry.province} onChange={e => setNewEntry({ ...newEntry, province: e.target.value })} placeholder="e.g. Antalya" /></div>
                <div><Label>Province (Arabic)</Label><Input value={newEntry.province_ar} onChange={e => setNewEntry({ ...newEntry, province_ar: e.target.value })} placeholder="أنطاليا" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>District / Town</Label><Input value={newEntry.district} onChange={e => setNewEntry({ ...newEntry, district: e.target.value })} placeholder="e.g. Alanya" /></div>
                <div><Label>District (Arabic)</Label><Input value={newEntry.district_ar} onChange={e => setNewEntry({ ...newEntry, district_ar: e.target.value })} placeholder="ألانيا" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Neighborhood</Label><Input value={newEntry.neighborhood} onChange={e => setNewEntry({ ...newEntry, neighborhood: e.target.value })} placeholder="e.g. Kestel" /></div>
                <div><Label>Neighborhood (Arabic)</Label><Input value={newEntry.neighborhood_ar} onChange={e => setNewEntry({ ...newEntry, neighborhood_ar: e.target.value })} placeholder="كستل" dir="rtl" /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAddEntry}>Add Location</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

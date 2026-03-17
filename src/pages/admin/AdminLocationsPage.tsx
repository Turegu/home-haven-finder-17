import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, Search, Trash2, MapPin, ChevronRight, Settings, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

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

export default function AdminLocationsPage() {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [settings, setSettings] = useState<LocationSetting[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({ province: "", province_ar: "", district: "", district_ar: "", neighborhood: "", neighborhood_ar: "" });

  const loadProvinces = useCallback(async () => {
    setLoading(true);
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, count } = await supabase
        .from("locations")
        .select("province, province_ar", { count: from === 0 ? "exact" : undefined })
        .eq("status", "active")
        .range(from, from + pageSize - 1);
      if (!data || data.length === 0) break;
      if (from === 0 && count) setTotalCount(count);
      allData.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    const uniqueMap = new Map<string, string>();
    allData.forEach((d: any) => { if (!uniqueMap.has(d.province)) uniqueMap.set(d.province, d.province_ar || ""); });
    const sorted = [...uniqueMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    setProvinces(sorted.map(([p]) => p));
    setProvinceArMap(Object.fromEntries(sorted));
    setLoading(false);
  }, []);

  const loadDistricts = useCallback(async (province: string) => {
    const { data } = await supabase
      .from("locations")
      .select("district")
      .eq("province", province)
      .eq("status", "active");

    if (data) {
      const unique = [...new Set(data.map((d: any) => d.district))].sort();
      setDistricts(unique);
    }
  }, []);

  const loadNeighborhoods = useCallback(async (province: string, district: string) => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("province", province)
      .eq("district", district)
      .eq("status", "active")
      .order("neighborhood");

    if (data) setNeighborhoods(data as Location[]);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("location_settings").select("*");
    if (data) setSettings(data as LocationSetting[]);
  }, []);

  useEffect(() => { loadProvinces(); loadSettings(); }, [loadProvinces, loadSettings]);

  useEffect(() => {
    if (selectedProvince) {
      setSelectedDistrict(null);
      setNeighborhoods([]);
      loadDistricts(selectedProvince);
    }
  }, [selectedProvince, loadDistricts]);

  useEffect(() => {
    if (selectedProvince && selectedDistrict) {
      loadNeighborhoods(selectedProvince, selectedDistrict);
    }
  }, [selectedProvince, selectedDistrict, loadNeighborhoods]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const q = searchQuery.trim();
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("status", "active")
      .or(`province.ilike.%${q}%,district.ilike.%${q}%,neighborhood.ilike.%${q}%`)
      .limit(100);

    if (data) {
      setNeighborhoods(data as Location[]);
      setSelectedProvince(null);
      setSelectedDistrict(null);
    }
    setLoading(false);
  };

  const handleDeleteNeighborhood = async (id: string) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Deleted");
    if (selectedProvince && selectedDistrict) loadNeighborhoods(selectedProvince, selectedDistrict);
  };

  const handleDeleteDistrict = async (province: string, district: string) => {
    if (!confirm(`Delete ALL neighborhoods in ${district}, ${province}?`)) return;
    const { error } = await supabase.from("locations").delete().eq("province", province).eq("district", district);
    if (error) { toast.error("Delete failed"); return; }
    toast.success(`Deleted all in ${district}`);
    setSelectedDistrict(null);
    setNeighborhoods([]);
    loadDistricts(province);
  };

  const handleDeleteProvince = async (province: string) => {
    if (!confirm(`Delete ALL locations in ${province}? This cannot be undone.`)) return;
    const { error } = await supabase.from("locations").delete().eq("province", province);
    if (error) { toast.error("Delete failed"); return; }
    toast.success(`Deleted all in ${province}`);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setNeighborhoods([]);
    setDistricts([]);
    loadProvinces();
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("location_settings").update({ setting_value: value }).eq("setting_key", key);
    if (error) toast.error("Failed to update");
    else { toast.success("Setting updated"); loadSettings(); }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

      // Skip header row
      const data = rows.slice(1).filter((r: any[]) => r[0] && r[2] && r[4]).map((r: any[]) => ({
        province: String(r[0] || "").trim(),
        province_ar: String(r[1] || "").trim(),
        district: String(r[2] || "").trim(),
        district_ar: String(r[3] || "").trim(),
        neighborhood: String(r[4] || "").trim(),
        neighborhood_ar: String(r[5] || "").trim(),
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
        // Delete all existing
        await supabase.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < uploadPreview.length; i += batchSize) {
        const batch = uploadPreview.slice(i, i + batchSize);
        const { error } = await supabase.from("locations").insert(batch);
        if (error) { toast.error(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`); setUploading(false); return; }
      }

      toast.success(`Imported ${uploadPreview.length} locations`);
      setUploadPreview(null);
      setShowUpload(false);
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setNeighborhoods([]);
      loadProvinces();
    } catch (err: any) {
      toast.error(err.message);
    }

    setUploading(false);
  };

  const handleAddEntry = async () => {
    if (!newEntry.province || !newEntry.district || !newEntry.neighborhood) {
      toast.error("Province, District, and Neighborhood are required");
      return;
    }
    const { error } = await supabase.from("locations").insert([newEntry]);
    if (error) { toast.error(error.message); return; }
    toast.success("Location added");
    setShowAddDialog(false);
    setNewEntry({ province: "", province_ar: "", district: "", district_ar: "", neighborhood: "", neighborhood_ar: "" });
    loadProvinces();
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
              <MapPin className="h-6 w-6 text-primary" /> Location Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount.toLocaleString()} locations across {provinces.length} provinces
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import Excel
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Location
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search provinces, districts, neighborhoods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          {(selectedProvince || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setNeighborhoods([]); setSearchQuery(""); }}>
              <X className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setNeighborhoods([]); }} className="hover:text-foreground">
            All Provinces
          </button>
          {selectedProvince && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <button onClick={() => { setSelectedDistrict(null); setNeighborhoods([]); }} className="hover:text-foreground text-primary font-medium">
                {selectedProvince}
              </button>
            </>
          )}
          {selectedDistrict && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-primary font-medium">{selectedDistrict}</span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg border border-border">
          {!selectedProvince && neighborhoods.length === 0 ? (
            /* Province list */
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-4">
                {provinces.filter(p => !searchQuery || p.toLowerCase().includes(searchQuery.toLowerCase())).map((province) => (
                  <button
                    key={province}
                    onClick={() => setSelectedProvince(province)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    <span className="text-sm font-medium text-foreground">{province}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProvince(province); }} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : selectedProvince && !selectedDistrict && neighborhoods.length === 0 ? (
            /* District list */
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-4">
                {districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => setSelectedDistrict(district)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    <span className="text-sm font-medium text-foreground">{district}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDistrict(selectedProvince, district); }} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            /* Neighborhood table */
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Province</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Neighborhood</TableHead>
                    <TableHead>Neighborhood (AR)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neighborhoods.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="text-sm">{loc.province}</TableCell>
                      <TableCell className="text-sm">{loc.district}</TableCell>
                      <TableCell className="text-sm font-medium">{loc.neighborhood}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" dir="rtl">{loc.neighborhood_ar}</TableCell>
                      <TableCell>
                        <button onClick={() => handleDeleteNeighborhood(loc.id)} className="text-destructive hover:text-destructive/80 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {neighborhoods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No locations found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Location Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Allowed Country (restricts keyword search)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    defaultValue={allowedCountry}
                    id="allowed_country"
                    placeholder="e.g. Turkey"
                  />
                  <Button size="sm" onClick={() => {
                    const v = (document.getElementById("allowed_country") as HTMLInputElement)?.value;
                    if (v) handleUpdateSetting("allowed_country", v);
                  }}>Save</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Keywords from search will be restricted to this country</p>
              </div>
              <div>
                <Label>Max Keyword Suggestions</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    defaultValue={maxSuggestions}
                    id="max_suggestions"
                    type="number"
                    min={1}
                    max={50}
                  />
                  <Button size="sm" onClick={() => {
                    const v = (document.getElementById("max_suggestions") as HTMLInputElement)?.value;
                    if (v) handleUpdateSetting("max_keyword_suggestions", v);
                  }}>Save</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Excel Dialog */}
        <Dialog open={showUpload} onOpenChange={(o) => { setShowUpload(o); if (!o) setUploadPreview(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Locations from Excel</DialogTitle>
            </DialogHeader>
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
                            <TableHead className="text-xs">Province</TableHead>
                            <TableHead className="text-xs">District</TableHead>
                            <TableHead className="text-xs">Neighborhood</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadPreview.slice(0, 20).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-1">{r.province}</TableCell>
                              <TableCell className="text-xs py-1">{r.district}</TableCell>
                              <TableCell className="text-xs py-1">{r.neighborhood}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {uploadPreview.length > 20 && <p className="text-xs text-muted-foreground text-center mt-2">... and {uploadPreview.length - 20} more</p>}
                    </ScrollArea>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => handleConfirmUpload("merge")} disabled={uploading}>
                      {uploading ? "Importing..." : "Merge (Add New)"}
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
            <DialogHeader>
              <DialogTitle>Add Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Province</Label>
                  <Input value={newEntry.province} onChange={e => setNewEntry({ ...newEntry, province: e.target.value })} placeholder="e.g. Antalya" />
                </div>
                <div>
                  <Label>Province (Arabic)</Label>
                  <Input value={newEntry.province_ar} onChange={e => setNewEntry({ ...newEntry, province_ar: e.target.value })} placeholder="أنطاليا" dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>District / Town</Label>
                  <Input value={newEntry.district} onChange={e => setNewEntry({ ...newEntry, district: e.target.value })} placeholder="e.g. Alanya" />
                </div>
                <div>
                  <Label>District (Arabic)</Label>
                  <Input value={newEntry.district_ar} onChange={e => setNewEntry({ ...newEntry, district_ar: e.target.value })} placeholder="ألانيا" dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Neighborhood</Label>
                  <Input value={newEntry.neighborhood} onChange={e => setNewEntry({ ...newEntry, neighborhood: e.target.value })} placeholder="e.g. Kestel" />
                </div>
                <div>
                  <Label>Neighborhood (Arabic)</Label>
                  <Input value={newEntry.neighborhood_ar} onChange={e => setNewEntry({ ...newEntry, neighborhood_ar: e.target.value })} placeholder="كستل" dir="rtl" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEntry}>Add Location</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

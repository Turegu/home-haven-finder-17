import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronDown, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationSelection {
  province?: string;
  district?: string;
  neighborhood?: string;
}

interface LocationPickerProps {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  /** Compact inline mode for search bars */
  compact?: boolean;
}

export default function LocationPicker({ value, onChange, compact = false }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [searchNearby, setSearchNearby] = useState(false);
  const [provinceFilter, setProvinceFilter] = useState("");

  useEffect(() => {
    async function loadProvinces() {
      const { data } = await supabase
        .from("locations")
        .select("province")
        .eq("status", "active");
      if (data) {
        const unique = [...new Set(data.map((d: any) => d.province))].sort();
        setProvinces(unique);
      }
    }
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!value.province) { setDistricts([]); return; }
    async function load() {
      const { data } = await supabase
        .from("locations")
        .select("district")
        .eq("province", value.province!)
        .eq("status", "active");
      if (data) {
        const unique = [...new Set(data.map((d: any) => d.district))].sort();
        setDistricts(unique);
      }
    }
    load();
  }, [value.province]);

  useEffect(() => {
    if (!value.province || !value.district) { setNeighborhoods([]); return; }
    async function load() {
      const { data } = await supabase
        .from("locations")
        .select("neighborhood")
        .eq("province", value.province!)
        .eq("district", value.district!)
        .eq("status", "active")
        .order("neighborhood");
      if (data) {
        setNeighborhoods(data.map((d: any) => d.neighborhood));
      }
    }
    load();
  }, [value.province, value.district]);

  const label = value.neighborhood || value.district || value.province || "Location";
  const hasSelection = !!(value.province || value.district || value.neighborhood);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({});
    setSearchNearby(false);
  };

  const filteredProvinces = provinceFilter
    ? provinces.filter(p => p.toLowerCase().includes(provinceFilter.toLowerCase()))
    : provinces;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[140px]">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className={hasSelection ? "text-foreground font-medium truncate max-w-[120px]" : "text-muted-foreground"}>
            {label}
          </span>
          {hasSelection ? (
            <button onClick={handleClear} className="ml-auto shrink-0">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          ) : (
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground shrink-0" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Province */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Province</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-md bg-background hover:border-primary/50">
                  <span className={value.province ? "text-foreground" : "text-muted-foreground"}>
                    {value.province || "Select Province"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-2" align="start">
                <Input
                  placeholder="Filter provinces..."
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                  className="mb-2 h-8 text-sm"
                />
                <ScrollArea className="h-[200px]">
                  <div className="space-y-0.5">
                    {filteredProvinces.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          onChange({ province: p });
                          setProvinceFilter("");
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${value.province === p ? "bg-primary/10 text-primary font-medium" : ""}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* District */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Town</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  disabled={!value.province}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-md bg-background hover:border-primary/50 disabled:opacity-50"
                >
                  <span className={value.district ? "text-foreground" : "text-muted-foreground"}>
                    {value.district || "Select Town"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-2" align="start">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-0.5">
                    {districts.map((d) => (
                      <button
                        key={d}
                        onClick={() => onChange({ province: value.province, district: d })}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${value.district === d ? "bg-primary/10 text-primary font-medium" : ""}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Neighborhood</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  disabled={!value.district}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-md bg-background hover:border-primary/50 disabled:opacity-50"
                >
                  <span className={value.neighborhood ? "text-foreground" : "text-muted-foreground"}>
                    {value.neighborhood || "Select Neighborhood"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-2" align="start">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-0.5">
                    {neighborhoods.map((n) => (
                      <button
                        key={n}
                        onClick={() => onChange({ ...value, neighborhood: n })}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${value.neighborhood === n ? "bg-primary/10 text-primary font-medium" : ""}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Nearby */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <Checkbox checked={searchNearby} onCheckedChange={(c) => setSearchNearby(!!c)} />
            <span className="text-sm text-foreground">Search Nearby</span>
          </label>

          {/* Clear */}
          {hasSelection && (
            <Button variant="outline" size="sm" className="w-full text-primary" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

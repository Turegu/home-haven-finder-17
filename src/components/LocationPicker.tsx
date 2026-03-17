import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronDown, X } from "lucide-react";
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
  compact?: boolean;
}

interface NamePair { name: string; ar: string }

const LocationPicker = forwardRef<HTMLButtonElement, LocationPickerProps>(({ value, onChange, compact = false }, ref) => {
  const [open, setOpen] = useState(false);
  const [provinces, setProvinces] = useState<NamePair[]>([]);
  const [districts, setDistricts] = useState<NamePair[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NamePair[]>([]);
  const [searchNearby, setSearchNearby] = useState(false);
  const [provinceFilter, setProvinceFilter] = useState("");

  useEffect(() => {
    async function loadProvinces() {
      let all: any[] = [];
      let from = 0;
      const ps = 1000;
      while (true) {
        const { data } = await supabase
          .from("locations")
          .select("province, province_ar")
          .eq("status", "active")
          .range(from, from + ps - 1);
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < ps) break;
        from += ps;
      }
      const map = new Map<string, string>();
      all.forEach((d: any) => { if (!map.has(d.province)) map.set(d.province, d.province_ar || ""); });
      const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      setProvinces(sorted.map(([name, ar]) => ({ name, ar })));
    }
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!value.province) { setDistricts([]); return; }
    async function load() {
      const { data } = await supabase
        .from("locations")
        .select("district, district_ar")
        .eq("province", value.province!)
        .eq("status", "active");
      if (data) {
        const map = new Map<string, string>();
        data.forEach((d: any) => { if (!map.has(d.district)) map.set(d.district, d.district_ar || ""); });
        const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        setDistricts(sorted.map(([name, ar]) => ({ name, ar })));
      }
    }
    load();
  }, [value.province]);

  useEffect(() => {
    if (!value.province || !value.district) { setNeighborhoods([]); return; }
    async function load() {
      const { data } = await supabase
        .from("locations")
        .select("neighborhood, neighborhood_ar")
        .eq("province", value.province!)
        .eq("district", value.district!)
        .eq("status", "active")
        .order("neighborhood");
      if (data) {
        setNeighborhoods(data.map((d: any) => ({ name: d.neighborhood, ar: d.neighborhood_ar || "" })));
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
    ? provinces.filter(p =>
        p.name.toLowerCase().includes(provinceFilter.toLowerCase()) ||
        p.ar.includes(provinceFilter)
      )
    : provinces;

  const renderItem = (item: NamePair, isSelected: boolean) => (
    <div className="flex items-center justify-between w-full">
      <span className={isSelected ? "text-primary font-medium" : ""}>{item.name}</span>
      {item.ar && <span className="text-xs text-muted-foreground ml-2" dir="rtl">{item.ar}</span>}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button ref={ref} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[140px]">
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
      <PopoverContent className="w-[320px] p-0" align="start">
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
              <PopoverContent className="w-[290px] p-2" align="start">
                <Input
                  placeholder="Filter provinces..."
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                  className="mb-2 h-8 text-sm"
                />
                <ScrollArea className="h-[240px]">
                  <div className="space-y-0.5">
                    {filteredProvinces.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => {
                          onChange({ province: p.name });
                          setProvinceFilter("");
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${value.province === p.name ? "bg-primary/10" : ""}`}
                      >
                        {renderItem(p, value.province === p.name)}
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
              <PopoverContent className="w-[290px] p-2" align="start">
                <ScrollArea className="h-[240px]">
                  <div className="space-y-0.5">
                    {districts.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => onChange({ province: value.province, district: d.name })}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${value.district === d.name ? "bg-primary/10" : ""}`}
                      >
                        {renderItem(d, value.district === d.name)}
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
              <PopoverContent className="w-[290px] p-2" align="start">
                <ScrollArea className="h-[240px]">
                  <div className="space-y-0.5">
                    {neighborhoods.map((n) => (
                      <button
                        key={n.name}
                        onClick={() => onChange({ ...value, neighborhood: n.name })}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${value.neighborhood === n.name ? "bg-primary/10" : ""}`}
                      >
                        {renderItem(n, value.neighborhood === n.name)}
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
});

LocationPicker.displayName = "LocationPicker";

export default LocationPicker;

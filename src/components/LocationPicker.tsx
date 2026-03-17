import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronDown, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Simple RTL detection: check if document dir is rtl
function useIsRtl() {
  const [rtl, setRtl] = useState(false);
  useEffect(() => {
    setRtl(document.documentElement.dir === "rtl" || document.documentElement.lang === "ar" || document.documentElement.lang === "fa");
  }, []);
  return rtl;
}

const LocationPicker = forwardRef<HTMLButtonElement, LocationPickerProps>(({ value, onChange, compact = false }, ref) => {
  const [open, setOpen] = useState(false);
  const [provinces, setProvinces] = useState<NamePair[]>([]);
  const [districts, setDistricts] = useState<NamePair[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NamePair[]>([]);
  const [provinceFilter, setProvinceFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");
  // Draft state for "Apply" flow
  const [draft, setDraft] = useState<LocationSelection>({});
  const isRtl = useIsRtl();

  // Sync draft when popover opens
  useEffect(() => {
    if (open) setDraft({ ...value });
  }, [open]);

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
    if (!draft.province) { setDistricts([]); return; }
    async function load() {
      const { data } = await supabase
        .from("locations")
        .select("district, district_ar")
        .eq("province", draft.province!)
        .eq("status", "active");
      if (data) {
        const map = new Map<string, string>();
        data.forEach((d: any) => { if (!map.has(d.district)) map.set(d.district, d.district_ar || ""); });
        const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        setDistricts(sorted.map(([name, ar]) => ({ name, ar })));
      }
    }
    load();
  }, [draft.province]);

  useEffect(() => {
    if (!draft.province || !draft.district) { setNeighborhoods([]); return; }
    async function load() {
      const { data } = await supabase
        .from("locations")
        .select("neighborhood, neighborhood_ar")
        .eq("province", draft.province!)
        .eq("district", draft.district!)
        .eq("status", "active")
        .order("neighborhood");
      if (data) {
        setNeighborhoods(data.map((d: any) => ({ name: d.neighborhood, ar: d.neighborhood_ar || "" })));
      }
    }
    load();
  }, [draft.province, draft.district]);

  const displayName = (item: NamePair) => isRtl && item.ar ? item.ar : item.name;

  const summaryText = () => {
    const parts: string[] = [];
    if (value.province) {
      const p = provinces.find(x => x.name === value.province);
      parts.push(p ? displayName(p) : value.province);
    }
    if (value.district) {
      const d = districts.find(x => x.name === value.district);
      parts.push(d ? displayName(d) : value.district);
    }
    if (value.neighborhood) parts.push(value.neighborhood);
    return parts.length > 0 ? parts.join(" › ") : "Location";
  };

  const hasSelection = !!(value.province || value.district || value.neighborhood);
  const hasDraft = !!(draft.province);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({});
    setDraft({});
  };

  const handleApply = () => {
    onChange({ ...draft });
    setOpen(false);
  };

  const filteredProvinces = provinceFilter
    ? provinces.filter(p =>
        p.name.toLowerCase().includes(provinceFilter.toLowerCase()) ||
        p.ar.includes(provinceFilter)
      )
    : provinces;

  const filteredDistricts = districtFilter
    ? districts.filter(d =>
        d.name.toLowerCase().includes(districtFilter.toLowerCase()) ||
        d.ar.includes(districtFilter)
      )
    : districts;

  const filteredNeighborhoods = neighborhoodFilter
    ? neighborhoods.filter(n =>
        n.name.toLowerCase().includes(neighborhoodFilter.toLowerCase()) ||
        n.ar.includes(neighborhoodFilter)
      )
    : neighborhoods;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button ref={ref} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[160px] max-w-[240px]">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className={`truncate ${hasSelection ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {summaryText()}
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
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Province</label>
            <InlineSelect
              items={filteredProvinces}
              selected={draft.province}
              displayName={displayName}
              placeholder="Select Province"
              filter={provinceFilter}
              onFilterChange={setProvinceFilter}
              filterPlaceholder="Filter provinces..."
              onSelect={(name) => {
                setDraft({ province: name });
                setProvinceFilter("");
                setDistrictFilter("");
                setNeighborhoodFilter("");
              }}
            />
          </div>

          {/* District */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Town</label>
            <InlineSelect
              items={filteredDistricts}
              selected={draft.district}
              displayName={displayName}
              placeholder="Select Town"
              disabled={!draft.province}
              filter={districtFilter}
              onFilterChange={setDistrictFilter}
              filterPlaceholder="Filter towns..."
              onSelect={(name) => {
                setDraft({ province: draft.province, district: name });
                setDistrictFilter("");
                setNeighborhoodFilter("");
              }}
            />
          </div>

          {/* Neighborhood */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Neighborhood</label>
            <InlineSelect
              items={filteredNeighborhoods}
              selected={draft.neighborhood}
              displayName={displayName}
              placeholder="Select Neighborhood"
              disabled={!draft.district}
              filter={neighborhoodFilter}
              onFilterChange={setNeighborhoodFilter}
              filterPlaceholder="Filter neighborhoods..."
              onSelect={(name) => {
                setDraft({ ...draft, neighborhood: name });
                setNeighborhoodFilter("");
              }}
            />
          </div>

          {/* Summary */}
          {hasDraft && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              {[draft.province, draft.district, draft.neighborhood].filter(Boolean).join(" › ")}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {hasDraft && (
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setDraft({}); }}>
                Clear
              </Button>
            )}
            <Button size="sm" className="flex-1" onClick={handleApply} disabled={!hasDraft}>
              <Check className="h-3.5 w-3.5 mr-1" /> Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

LocationPicker.displayName = "LocationPicker";

/* ── Inline dropdown select sub-component ── */
interface InlineSelectProps {
  items: NamePair[];
  selected?: string;
  displayName: (item: NamePair) => string;
  placeholder: string;
  disabled?: boolean;
  filter: string;
  onFilterChange: (v: string) => void;
  filterPlaceholder: string;
  onSelect: (name: string) => void;
}

function InlineSelect({ items, selected, displayName, placeholder, disabled, filter, onFilterChange, filterPlaceholder, onSelect }: InlineSelectProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const selectedItem = items.find(i => i.name === selected);

  return (
    <Popover open={innerOpen} onOpenChange={setInnerOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-md bg-background hover:border-primary/50 disabled:opacity-50"
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selectedItem ? displayName(selectedItem) : (selected || placeholder)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-2" align="start">
        <Input
          placeholder={filterPlaceholder}
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <ScrollArea className="h-[220px]">
          <div className="space-y-0.5">
            {items.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onSelect(item.name);
                  setInnerOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${selected === item.name ? "bg-primary/10 text-primary font-medium" : ""}`}
              >
                {displayName(item)}
              </button>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No results</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default LocationPicker;

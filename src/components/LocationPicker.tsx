import { useState, useEffect, useRef, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronDown, X, Check, ChevronRight } from "lucide-react";
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

// Module-level cache
let provincesCache: NamePair[] | null = null;

function useIsRtl() {
  const [rtl, setRtl] = useState(false);
  useEffect(() => {
    setRtl(document.documentElement.dir === "rtl" || document.documentElement.lang === "ar" || document.documentElement.lang === "fa");
  }, []);
  return rtl;
}

type Step = "province" | "district" | "neighborhood";

const LocationPicker = forwardRef<HTMLButtonElement, LocationPickerProps>(({ value, onChange, compact = false }, ref) => {
  const [open, setOpen] = useState(false);
  const [provinces, setProvinces] = useState<NamePair[]>([]);
  const [districts, setDistricts] = useState<NamePair[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NamePair[]>([]);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState<LocationSelection>({});
  const [step, setStep] = useState<Step>("province");
  const isRtl = useIsRtl();
  const filterRef = useRef<HTMLInputElement>(null);

  // Sync draft & step when popover opens
  useEffect(() => {
    if (open) {
      setDraft({ ...value });
      setFilter("");
      if (value.district) setStep("neighborhood");
      else if (value.province) setStep("district");
      else setStep("province");
    }
  }, [open]);

  // Focus filter input on step change
  useEffect(() => {
    if (open) setTimeout(() => filterRef.current?.focus(), 50);
  }, [step, open]);

  // Load provinces (cached)
  useEffect(() => {
    if (provincesCache) { setProvinces(provincesCache); return; }
    supabase.rpc("get_distinct_provinces").then(({ data }) => {
      if (data) { provincesCache = data as NamePair[]; setProvinces(provincesCache); }
    });
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!draft.province) { setDistricts([]); return; }
    supabase.rpc("get_distinct_districts", { p_province: draft.province }).then(({ data }) => {
      if (data) setDistricts(data as NamePair[]);
    });
  }, [draft.province]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (!draft.province || !draft.district) { setNeighborhoods([]); return; }
    supabase.rpc("get_neighborhoods", { p_province: draft.province, p_district: draft.district }).then(({ data }) => {
      if (data) setNeighborhoods(data as NamePair[]);
    });
  }, [draft.province, draft.district]);

  const dn = (item: NamePair) => isRtl && item.ar ? item.ar : item.name;

  // Normalize for accent/Turkish-insensitive search
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/ı/g, "i").replace(/İ/gi, "i").replace(/ş/g, "s").replace(/ç/g, "c")
      .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u");

  const summaryText = () => {
    const parts: string[] = [];
    if (value.province) {
      const p = provinces.find(x => x.name === value.province);
      parts.push(p ? dn(p) : value.province);
    }
    if (value.district) {
      const d = districts.find(x => x.name === value.district);
      parts.push(d ? dn(d) : value.district);
    }
    if (value.neighborhood) parts.push(value.neighborhood);
    return parts.length > 0 ? parts.join(" › ") : "Location";
  };

  const hasSelection = !!(value.province || value.district || value.neighborhood);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({});
    setDraft({});
  };

  const handleApply = () => {
    onChange({ ...draft });
    setOpen(false);
  };

  // Get current list and step info
  const stepConfig = {
    province: {
      label: "Province",
      items: provinces,
      selected: draft.province,
      onSelect: (name: string) => {
        setDraft({ province: name });
        setFilter("");
        setStep("district");
      },
    },
    district: {
      label: "Town",
      items: districts,
      selected: draft.district,
      onSelect: (name: string) => {
        setDraft({ province: draft.province, district: name });
        setFilter("");
        setStep("neighborhood");
      },
    },
    neighborhood: {
      label: "Neighborhood",
      items: neighborhoods,
      selected: draft.neighborhood,
      onSelect: (name: string) => {
        setDraft({ ...draft, neighborhood: name });
        setFilter("");
      },
    },
  };

  const current = stepConfig[step];

  const filtered = filter
    ? current.items.filter(i =>
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        i.ar.includes(filter)
      )
    : current.items;

  // Breadcrumb navigation
  const breadcrumbs: { label: string; step: Step; value?: string }[] = [
    { label: "Province", step: "province", value: draft.province },
  ];
  if (draft.province) breadcrumbs.push({ label: "Town", step: "district", value: draft.district });
  if (draft.district) breadcrumbs.push({ label: "Neighborhood", step: "neighborhood", value: draft.neighborhood });

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
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500 shrink-0" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Breadcrumb nav */}
        <div className="flex items-center gap-1 px-3 pt-3 pb-2 text-xs">
          {breadcrumbs.map((bc, i) => (
            <span key={bc.step} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                onClick={() => { setStep(bc.step); setFilter(""); }}
                className={`transition-colors ${step === bc.step ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                {bc.value || bc.label}
              </button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <Input
            ref={filterRef}
            placeholder={`Search ${current.label.toLowerCase()}...`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* List */}
        <ScrollArea className="h-[240px]">
          <div className="px-2 pb-2 space-y-0.5">
            {filtered.map((item) => (
              <button
                key={item.name}
                onClick={() => current.onSelect(item.name)}
                className={`w-full text-left px-2.5 py-2 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between ${
                  current.selected === item.name ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              >
                {dn(item)}
                {current.selected === item.name && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No results found</p>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-2 flex gap-2">
          {draft.province && (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setDraft({}); setStep("province"); setFilter(""); }}>
              Clear
            </Button>
          )}
          <Button size="sm" className="flex-1" onClick={handleApply} disabled={!draft.province}>
            <Check className="h-3.5 w-3.5 mr-1" /> Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

LocationPicker.displayName = "LocationPicker";

export default LocationPicker;

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface NamePair { name: string; ar: string }

// Module-level cache for provinces (same as LocationPicker)
let provincesCache: NamePair[] | null = null;

interface LocationFormFieldsProps {
  province: string;
  town: string;
  neighbourhood: string;
  pinLocation?: string;
  onProvinceChange: (value: string) => void;
  onTownChange: (value: string) => void;
  onNeighbourhoodChange: (value: string) => void;
  onPinLocationChange?: (value: string) => void;
  showPinLocation?: boolean;
  showMap?: boolean;
  className?: string;
}

const LocationFormFields = ({
  province,
  town,
  neighbourhood,
  pinLocation = "",
  onProvinceChange,
  onTownChange,
  onNeighbourhoodChange,
  onPinLocationChange,
  showPinLocation = true,
  showMap = true,
  className = "",
}: LocationFormFieldsProps) => {
  const [provinces, setProvinces] = useState<NamePair[]>([]);
  const [districts, setDistricts] = useState<NamePair[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NamePair[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [manuallyEdited, setManuallyEdited] = useState(false);

  // Load provinces (cached)
  useEffect(() => {
    if (provincesCache) {
      setProvinces(provincesCache);
      return;
    }
    setLoadingProvinces(true);
    supabase.rpc("get_distinct_provinces").then(({ data }) => {
      if (data) {
        provincesCache = data as NamePair[];
        setProvinces(provincesCache);
      }
      setLoadingProvinces(false);
    });
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!province) {
      setDistricts([]);
      setNeighborhoods([]);
      return;
    }
    setLoadingDistricts(true);
    supabase.rpc("get_distinct_districts", { p_province: province }).then(({ data }) => {
      if (data) setDistricts(data as NamePair[]);
      setLoadingDistricts(false);
    });
  }, [province]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (!province || !town) {
      setNeighborhoods([]);
      return;
    }
    setLoadingNeighborhoods(true);
    supabase.rpc("get_neighborhoods", { p_province: province, p_district: town }).then(({ data }) => {
      if (data) setNeighborhoods(data as NamePair[]);
      setLoadingNeighborhoods(false);
    });
  }, [province, town]);

  // Auto-populate pin location when dropdowns change
  const _expectedLocation = useMemo(() => {
    const parts: string[] = [];
    if (neighbourhood) parts.push(neighbourhood);
    if (town) parts.push(town);
    if (province) parts.push(province);
    return parts.join(", ");
  }, [province, town, neighbourhood]);

  // Auto-populate pin location when dropdowns change
  const handleProvinceChange = useCallback((v: string) => {
    onProvinceChange(v);
    onTownChange("");
    onNeighbourhoodChange("");
    setManuallyEdited(false);
    onPinLocationChange?.(v);
  }, [onProvinceChange, onTownChange, onNeighbourhoodChange, onPinLocationChange]);

  const handleTownChange = useCallback((v: string) => {
    onTownChange(v);
    onNeighbourhoodChange("");
    setManuallyEdited(false);
    // Auto-set pin to "Town, Province"
    const loc = [v, province].filter(Boolean).join(", ");
    onPinLocationChange?.(loc);
  }, [onTownChange, onNeighbourhoodChange, onPinLocationChange, province]);

  const handleNeighbourhoodChange = useCallback((v: string) => {
    onNeighbourhoodChange(v);
    setManuallyEdited(false);
    // Auto-set pin to "Neighbourhood, Town, Province"
    const loc = [v, town, province].filter(Boolean).join(", ");
    onPinLocationChange?.(loc);
  }, [onNeighbourhoodChange, onPinLocationChange, town, province]);

  // Check if pin location mismatches the selected dropdown location
  const mismatchWarning = useMemo(() => {
    if (!pinLocation || !province || !manuallyEdited) return null;
    const pinLower = pinLocation.toLowerCase();
    const provinceLower = province.toLowerCase();
    const townLower = town?.toLowerCase();

    // Check if pin contains the province name
    if (!pinLower.includes(provinceLower)) {
      return `Pin location doesn't appear to be in ${province}. Please verify it matches your selected location.`;
    }
    // If town is selected, check if pin contains it
    if (townLower && !pinLower.includes(townLower)) {
      return `Pin location doesn't appear to be in ${town}, ${province}. Please verify it matches your selected location.`;
    }
    return null;
  }, [pinLocation, province, town, manuallyEdited]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${className}`}>
      {/* Province */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Province</Label>
        <Select value={province} onValueChange={handleProvinceChange}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder={loadingProvinces ? "Loading..." : "Select Province"} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City/Town */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">City/Town</Label>
        <Select value={town} onValueChange={handleTownChange} disabled={!province}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder={
              !province ? "Select province first" :
              loadingDistricts ? "Loading..." : "Select City/Town"
            } />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Neighbourhood */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Neighbourhood</Label>
        <Select value={neighbourhood} onValueChange={handleNeighbourhoodChange} disabled={!town}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder={
              !town ? "Select city/town first" :
              loadingNeighborhoods ? "Loading..." : "Select Neighbourhood"
            } />
          </SelectTrigger>
          <SelectContent>
            {neighborhoods.map((n) => (
              <SelectItem key={n.name} value={n.name}>{n.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pin Location */}
      {showPinLocation && (
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Pin Location</Label>
          <Input
            value={pinLocation}
            onChange={(e) => {
              setManuallyEdited(true);
              onPinLocationChange?.(e.target.value);
            }}
            className="bg-secondary/50"
            placeholder="Auto-filled from location — adjust if needed"
          />
        </div>
      )}

      {/* Mismatch Warning */}
      {mismatchWarning && (
        <div className="md:col-span-2 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg px-3.5 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{mismatchWarning}</span>
        </div>
      )}

      {/* Map */}
      {showMap && (
        <div className="md:col-span-2 mt-2 rounded-lg border border-border overflow-hidden bg-muted/50 h-[250px]">
          {pinLocation ? (
            <iframe
              title="Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(pinLocation)}&output=embed`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a location above to show map
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationFormFields;

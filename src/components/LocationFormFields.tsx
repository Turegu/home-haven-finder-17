import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/ui/searchable-select";
import "leaflet/dist/leaflet.css";

interface NamePair { name: string; ar: string }

// Module-level cache for provinces (same as LocationPicker)
let provincesCache: NamePair[] | null = null;

// City coordinate lookup for auto-centering
const cityCoords: Record<string, [number, number]> = {
  'istanbul': [41.0082, 28.9784],
  'ankara': [39.9334, 32.8597],
  'antalya': [36.8969, 30.7133],
  'izmir': [38.4192, 27.1287],
  'bursa': [40.1826, 29.0665],
  'adana': [37.0, 35.3213],
  'gaziantep': [37.0662, 37.3833],
  'konya': [37.8714, 32.4846],
  'mersin': [36.8121, 34.6415],
  'kayseri': [38.7312, 35.4787],
  'trabzon': [41.0027, 39.7168],
  'samsun': [41.2867, 36.33],
  'eskişehir': [39.7767, 30.5206],
  'diyarbakır': [37.9144, 40.2306],
  'muğla': [37.2153, 28.3636],
  'denizli': [37.7765, 29.0864],
  'dubai': [25.2048, 55.2708],
  'abu dhabi': [24.4539, 54.3773],
};

function getCityCenter(province: string, town: string): [number, number] | null {
  const lookups = [town, province].filter(Boolean);
  for (const name of lookups) {
    const key = name.toLowerCase();
    if (cityCoords[key]) return cityCoords[key];
  }
  return null;
}

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

/* ─── Interactive Leaflet Map for pin placement ─── */
function InteractiveMapPicker({
  pinLocation,
  onPinLocationChange,
  province,
  town,
}: {
  pinLocation: string;
  onPinLocationChange: (value: string) => void;
  province: string;
  town: string;
}) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<any>(null);

  // Parse existing pin_location "lat,lng" string
  const parsedCoords = useMemo(() => {
    if (!pinLocation) return null;
    const parts = pinLocation.split(",").map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  }, [pinLocation]);

  // Create a reliable custom marker icon using divIcon (avoids broken default icon)
  const createPinIcon = useCallback((leaflet: any) => {
    return leaflet.divIcon({
      className: "",
      html: `<div style="background:#0d9488;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }, []);

  // Load Leaflet dynamically
  useEffect(() => {
    import("leaflet").then((mod) => {
      setL(mod.default);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;

    // Determine initial center
    const cityCenter = getCityCenter(province, town);
    const initial = parsedCoords
      ? [parsedCoords.lat, parsedCoords.lng] as [number, number]
      : cityCenter || [39.0, 35.0];
    const zoom = parsedCoords ? 15 : (cityCenter ? 12 : 6);

    const map = L.map(containerRef.current, {
      center: initial,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OSM",
      maxZoom: 19,
    }).addTo(map);

    // Add marker if we have coords
    if (parsedCoords) {
      markerRef.current = L.marker([parsedCoords.lat, parsedCoords.lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        onPinLocationChange(`${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`);
      });
    }

    // Click to place/move pin
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      onPinLocationChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng();
          onPinLocationChange(`${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`);
        });
      }
    });

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [L]); // Only init once when L loads

  // Update map center when province/town changes (if no pin yet)
  useEffect(() => {
    if (!mapRef.current || !L || parsedCoords) return;
    const cityCenter = getCityCenter(province, town);
    if (cityCenter) {
      mapRef.current.setView(cityCenter, 12);
    }
  }, [province, town, L]);

  // Update marker when pinLocation changes externally
  useEffect(() => {
    if (!mapRef.current || !L || !parsedCoords) return;
    if (markerRef.current) {
      const pos = markerRef.current.getLatLng();
      if (Math.abs(pos.lat - parsedCoords.lat) > 0.0001 || Math.abs(pos.lng - parsedCoords.lng) > 0.0001) {
        markerRef.current.setLatLng([parsedCoords.lat, parsedCoords.lng]);
        mapRef.current.setView([parsedCoords.lat, parsedCoords.lng], mapRef.current.getZoom());
      }
    }
  }, [parsedCoords, L]);

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      onPinLocationChange(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      mapRef.current.setView([latitude, longitude], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else if (L) {
        markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
        markerRef.current.on("dragend", () => {
          const p = markerRef.current.getLatLng();
          onPinLocationChange(`${p.lat.toFixed(6)},${p.lng.toFixed(6)}`);
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Click on the map to place your listing pin
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleLocateMe}>
          <Navigation className="h-3 w-3" /> My Location
        </Button>
      </div>
      <div ref={containerRef} className="h-[280px] rounded-lg border border-border overflow-hidden z-0" />
      {pinLocation && parsedCoords && (
        <p className="text-xs text-muted-foreground">
          📍 {parsedCoords.lat.toFixed(6)}, {parsedCoords.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
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

  const handleProvinceChange = useCallback((v: string) => {
    onProvinceChange(v);
    onTownChange("");
    onNeighbourhoodChange("");
  }, [onProvinceChange, onTownChange, onNeighbourhoodChange]);

  const handleTownChange = useCallback((v: string) => {
    onTownChange(v);
    onNeighbourhoodChange("");
  }, [onTownChange, onNeighbourhoodChange]);

  const handleNeighbourhoodChange = useCallback((v: string) => {
    onNeighbourhoodChange(v);
  }, [onNeighbourhoodChange]);

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Province */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Province</Label>
          <SearchableSelect
            value={province}
            onValueChange={handleProvinceChange}
            options={provinces.map((p) => ({ value: p.name, label: p.name }))}
            placeholder={loadingProvinces ? "Loading..." : "Select Province"}
          />
        </div>

        {/* City/Town */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">City/Town</Label>
          <SearchableSelect
            value={town}
            onValueChange={handleTownChange}
            options={districts.map((d) => ({ value: d.name, label: d.name }))}
            placeholder={
              !province ? "Select province first" :
              loadingDistricts ? "Loading..." : "Select City/Town"
            }
            disabled={!province}
          />
        </div>

        {/* Neighbourhood */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Neighbourhood</Label>
          <SearchableSelect
            value={neighbourhood}
            onValueChange={handleNeighbourhoodChange}
            options={neighborhoods.map((n) => ({ value: n.name, label: n.name }))}
            placeholder={
              !town ? "Select city/town first" :
              loadingNeighborhoods ? "Loading..." : "Select Neighbourhood"
            }
            disabled={!town}
          />
        </div>

        {/* Pin Location coordinate display */}
        {showPinLocation && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Pin Coordinates</Label>
            <Input
              value={pinLocation}
              onChange={(e) => onPinLocationChange?.(e.target.value)}
              className="bg-secondary/50"
              placeholder="Click on map or enter lat,lng"
            />
          </div>
        )}
      </div>

      {/* Interactive Map */}
      {showMap && showPinLocation && onPinLocationChange && (
        <InteractiveMapPicker
          pinLocation={pinLocation}
          onPinLocationChange={onPinLocationChange}
          province={province}
          town={town}
        />
      )}
    </div>
  );
};

export default LocationFormFields;

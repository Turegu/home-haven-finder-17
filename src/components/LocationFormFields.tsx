import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
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

// Metropolitan provinces whose "city center" is split into multiple districts
// When user selects "{Province} (Central)", we fetch neighborhoods from all these districts
const METRO_CENTRAL_DISTRICTS: Record<string, string[]> = {
  'Adana': ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam'],
  'Ankara': ['Çankaya', 'Keçiören', 'Etimesgut', 'Yenimahalle', 'Mamak', 'Altındağ', 'Sincan', 'Pursaklar'],
  'İstanbul': ['Kadıköy', 'Beşiktaş', 'Beyoğlu', 'Fatih', 'Şişli', 'Üsküdar', 'Bakırköy', 'Sarıyer', 'Ataşehir', 'Maltepe', 'Zeytinburnu', 'Eyüpsultan', 'Bayrampaşa', 'Kağıthane'],
  'İzmir': ['Konak', 'Bornova', 'Karşıyaka', 'Buca', 'Bayraklı', 'Çiğli', 'Gaziemir', 'Balçova', 'Narlıdere'],
  'Bursa': ['Osmangazi', 'Nilüfer', 'Yıldırım'],
  'Antalya': ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Döşemealtı', 'Aksu'],
  'Gaziantep': ['Şahinbey', 'Şehitkamil', 'Oğuzeli'],
  'Konya': ['Selçuklu', 'Meram', 'Karatay'],
  'Mersin': ['Yenişehir', 'Toroslar', 'Akdeniz', 'Mezitli'],
  'Kayseri': ['Melikgazi', 'Kocasinan', 'Talas'],
};

function getCentralLabel(province: string): string {
  return `${province} (Central)`;
}

function isCentralOption(townValue: string): boolean {
  return townValue.endsWith(' (Central)');
}

function getCentralDistricts(province: string): string[] | null {
  return METRO_CENTRAL_DISTRICTS[province] || null;
}

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
  // Districts
  'konyaaltı': [36.8693, 30.6377],
  'kepez': [37.0833, 30.7167],
  'muratpaşa': [36.8857, 30.7041],
  'alanya': [36.5437, 31.9954],
  'manavgat': [36.7867, 31.4434],
  'kaş': [36.2013, 29.6383],
  'belek': [36.8593, 31.0565],
  'kadıköy': [40.9927, 29.0278],
  'beşiktaş': [41.0422, 29.0067],
  'beyoğlu': [41.0370, 28.9770],
  'üsküdar': [41.0242, 29.0153],
  'bakırköy': [40.9819, 28.8772],
  'sarıyer': [41.1667, 29.05],
  'ataşehir': [40.9833, 29.1167],
  'fatih': [41.0186, 28.9397],
  'şişli': [41.0602, 28.9877],
  'çankaya': [39.9179, 32.8627],
  'keçiören': [39.9833, 32.8667],
  'etimesgut': [39.9500, 32.6833],
  'bornova': [38.4667, 27.2167],
  'karşıyaka': [38.4569, 27.1094],
  'konak': [38.4167, 27.1333],
  'nilüfer': [40.2121, 28.8932],
  'osmangazi': [40.1833, 29.0667],
};

function getCityCenter(province: string, town: string): [number, number] | null {
  const lookups = [town, province].filter(Boolean);
  for (const name of lookups) {
    const key = name.toLowerCase();
    if (cityCoords[key]) return cityCoords[key];
  }
  return null;
}

// Fetch admin boundary polygon from OSM Nominatim
const boundaryCache: Record<string, number[][][] | null> = {};

async function fetchDistrictBoundary(province: string, town: string): Promise<number[][][] | null> {
  const cacheKey = `${province}|${town}`;
  if (cacheKey in boundaryCache) return boundaryCache[cacheKey];

  try {
    // Try structured query first for better results (county=district within state=province)
    const structuredUrl = `https://nominatim.openstreetmap.org/search?county=${encodeURIComponent(town)}&state=${encodeURIComponent(province)}&country=Turkey&format=json&polygon_geojson=1&limit=1&accept-language=en,tr`;
    let res = await fetch(structuredUrl, { headers: { 'User-Agent': 'LovableRealEstate/1.0' } });
    let data = res.ok ? await res.json() : [];

    // If structured query didn't return a polygon, try free-form with "district"
    if (!data?.[0]?.geojson || data[0].geojson.type === 'Point') {
      const freeQuery = `${town} district, ${province}, Turkey`;
      res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(freeQuery)}&format=json&polygon_geojson=1&limit=1&accept-language=en,tr`,
        { headers: { 'User-Agent': 'LovableRealEstate/1.0' } }
      );
      data = res.ok ? await res.json() : [];
    }

    // Last fallback: simple query
    if (!data?.[0]?.geojson || data[0].geojson.type === 'Point') {
      const simpleQuery = `${town}, ${province}`;
      res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simpleQuery)}&format=json&polygon_geojson=1&limit=1&accept-language=en,tr`,
        { headers: { 'User-Agent': 'LovableRealEstate/1.0' } }
      );
      data = res.ok ? await res.json() : [];
    }

    if (!data?.[0]?.geojson) { boundaryCache[cacheKey] = null; return null; }

    const geo = data[0].geojson;
    let polygons: number[][][] = [];

    if (geo.type === 'Polygon') {
      polygons = geo.coordinates;
    } else if (geo.type === 'MultiPolygon') {
      for (const poly of geo.coordinates) {
        polygons.push(...poly);
      }
    } else {
      boundaryCache[cacheKey] = null;
      return null;
    }

    boundaryCache[cacheKey] = polygons;
    return polygons;
  } catch {
    boundaryCache[cacheKey] = null;
    return null;
  }
}

// Ray-casting point-in-polygon check
function isPointInPolygons(lat: number, lng: number, polygons: number[][][]): boolean {
  for (const ring of polygons) {
    if (isPointInRing(lat, lng, ring)) return true;
  }
  return false;
}

function isPointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    // GeoJSON coordinates are [lng, lat]
    const xi = ring[i][1], yi = ring[i][0];
    const xj = ring[j][1], yj = ring[j][0];
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Reverse geocode using Nominatim (free, no API key needed)
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en,tr`,
      { headers: { 'User-Agent': 'LovableRealEstate/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    return addr?.neighbourhood || addr?.suburb || addr?.quarter || addr?.hamlet || addr?.village || null;
  } catch {
    return null;
  }
}

// Fuzzy match: normalize Turkish chars and compare
function normalizeForMatch(s: string): string {
  return s.toLowerCase()
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/\s+/g, ' ').trim();
}

function findBestNeighbourhoodMatch(nominatimName: string, options: NamePair[]): string | null {
  const needle = normalizeForMatch(nominatimName);
  for (const opt of options) {
    if (normalizeForMatch(opt.name) === needle) return opt.name;
  }
  for (const opt of options) {
    const norm = normalizeForMatch(opt.name);
    if (norm.includes(needle) || needle.includes(norm)) return opt.name;
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
  neighborhoods,
  onNeighbourhoodChange,
}: {
  pinLocation: string;
  onPinLocationChange: (value: string) => void;
  province: string;
  town: string;
  neighborhoods: NamePair[];
  onNeighbourhoodChange: (value: string) => void;
}) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const trySetPinRef = useRef<(lat: number, lng: number) => boolean>(() => false);
  const boundaryLayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);
  const [boundsError, setBoundsError] = useState<string | null>(null);
  const [boundaryPolygons, setBoundaryPolygons] = useState<number[][][] | null>(null);
  const [loadingBoundary, setLoadingBoundary] = useState(false);

  // Parse existing pin_location "lat,lng" string
  const parsedCoords = useMemo(() => {
    if (!pinLocation) return null;
    const parts = pinLocation.split(",").map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  }, [pinLocation]);

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

  // Fetch boundary when province+town changes — handle "(Central)" option
  useEffect(() => {
    if (!province || !town) {
      setBoundaryPolygons(null);
      return;
    }
    setLoadingBoundary(true);

    if (isCentralOption(town)) {
      // Fetch boundaries for all central districts and merge
      const centralDistricts = getCentralDistricts(province) || [];
      Promise.all(
        centralDistricts.map(d => fetchDistrictBoundary(province, d))
      ).then((results) => {
        const merged: number[][][] = [];
        for (const polys of results) {
          if (polys) merged.push(...polys);
        }
        setBoundaryPolygons(merged.length > 0 ? merged : null);
        setLoadingBoundary(false);
      });
    } else {
      fetchDistrictBoundary(province, town).then((polys) => {
        setBoundaryPolygons(polys);
        setLoadingBoundary(false);
      });
    }
  }, [province, town]);

  // Validate and set pin using polygon boundary
  const trySetPin = useCallback((lat: number, lng: number) => {
    if (boundaryPolygons) {
      if (!isPointInPolygons(lat, lng, boundaryPolygons)) {
        setBoundsError(`Pin must be placed within ${town} district boundary.`);
        setTimeout(() => setBoundsError(null), 3000);
        return false;
      }
    }

    setBoundsError(null);
    onPinLocationChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);

    // Auto-detect neighbourhood via reverse geocoding
    if (neighborhoods.length > 0) {
      reverseGeocode(lat, lng).then((nominatimName) => {
        if (nominatimName) {
          const match = findBestNeighbourhoodMatch(nominatimName, neighborhoods);
          if (match) {
            onNeighbourhoodChange(match);
          }
        }
      });
    }

    return true;
  }, [boundaryPolygons, town, onPinLocationChange, neighborhoods, onNeighbourhoodChange]);

  // Keep ref in sync so map event handlers always use latest closure
  trySetPinRef.current = trySetPin;

  // Load Leaflet dynamically
  useEffect(() => {
    import("leaflet").then((mod) => {
      setL(mod.default);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;

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
      markerRef.current = L.marker([parsedCoords.lat, parsedCoords.lng], { draggable: true, icon: createPinIcon(L) }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        if (!trySetPinRef.current(pos.lat, pos.lng)) {
          if (parsedCoords) {
            markerRef.current.setLatLng([parsedCoords.lat, parsedCoords.lng]);
          }
        }
      });
    }

    // Click to place/move pin — enforce boundary
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      if (!trySetPinRef.current(lat, lng)) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true, icon: createPinIcon(L) }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng();
          if (!trySetPinRef.current(pos.lat, pos.lng)) {
            markerRef.current.setLatLng([lat, lng]);
          }
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      boundaryLayerRef.current = null;
    };
  }, [L]);

  // Draw boundary polygon on map when it loads/changes
  useEffect(() => {
    if (!mapRef.current || !L) return;

    // Remove old boundary layer
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (boundaryPolygons && boundaryPolygons.length > 0) {
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const latLngPolygons = boundaryPolygons.map(ring =>
        ring.map(coord => [coord[1], coord[0]] as [number, number])
      );

      boundaryLayerRef.current = L.polygon(latLngPolygons, {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(mapRef.current);

      // Fit map to boundary
      mapRef.current.fitBounds(boundaryLayerRef.current.getBounds(), { padding: [20, 20] });
    } else {
      // Fallback: center on city coords
      const cityCenter = getCityCenter(province, town);
      if (cityCenter) {
        mapRef.current.setView(cityCenter, town ? 13 : 10, { animate: true });
      }
    }

    // Clear pin if it's now outside boundary
    if (parsedCoords && boundaryPolygons && !isPointInPolygons(parsedCoords.lat, parsedCoords.lng, boundaryPolygons)) {
      onPinLocationChange("");
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [boundaryPolygons, L]);

  // Update map center when province/town changes and no boundary yet
  useEffect(() => {
    if (!mapRef.current || !L || boundaryPolygons) return;
    const cityCenter = getCityCenter(province, town);
    if (cityCenter) {
      mapRef.current.setView(cityCenter, town ? 13 : 10, { animate: true });
    }
  }, [province, town, L, boundaryPolygons]);

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
      if (!trySetPinRef.current(latitude, longitude)) return;

      mapRef.current.setView([latitude, longitude], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else if (L) {
        markerRef.current = L.marker([latitude, longitude], { draggable: true, icon: createPinIcon(L) }).addTo(mapRef.current);
        markerRef.current.on("dragend", () => {
          const p = markerRef.current.getLatLng();
          if (!trySetPinRef.current(p.lat, p.lng)) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {loadingBoundary ? "Loading district boundary..." : `Click within the blue boundary to place your pin in ${town}`}
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleLocateMe}>
          <Navigation className="h-3 w-3" /> My Location
        </Button>
      </div>
      <div ref={containerRef} className="h-[280px] rounded-lg border border-border overflow-hidden z-0" />
      {boundsError && (
        <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in">
          <AlertTriangle className="h-3 w-3" /> {boundsError}
        </p>
      )}
      {!boundaryPolygons && !loadingBoundary && province && town && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> District boundary not available — pin placement unrestricted.
        </p>
      )}
      {pinLocation && parsedCoords && !boundsError && (
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

  // Load districts when province changes — add "(Central)" option for metro cities
  useEffect(() => {
    if (!province) {
      setDistricts([]);
      setNeighborhoods([]);
      return;
    }
    setLoadingDistricts(true);
    supabase.rpc("get_distinct_districts", { p_province: province }).then(({ data }) => {
      if (data) {
        const list = data as NamePair[];
        // If this province has central districts, prepend a virtual option
        if (METRO_CENTRAL_DISTRICTS[province]) {
          const centralOption: NamePair = { name: getCentralLabel(province), ar: '' };
          setDistricts([centralOption, ...list]);
        } else {
          setDistricts(list);
        }
      }
      setLoadingDistricts(false);
    });
  }, [province]);

  // Load neighborhoods when district changes — handle "(Central)" virtual option
  useEffect(() => {
    if (!province || !town) {
      setNeighborhoods([]);
      return;
    }
    setLoadingNeighborhoods(true);

    if (isCentralOption(town)) {
      // Fetch neighborhoods from ALL central districts
      const centralDistricts = getCentralDistricts(province) || [];
      Promise.all(
        centralDistricts.map(d =>
          supabase.rpc("get_neighborhoods", { p_province: province, p_district: d }).then(({ data }) => (data || []) as NamePair[])
        )
      ).then((results) => {
        // Merge, deduplicate by name, sort
        const merged = new Map<string, NamePair>();
        for (const list of results) {
          for (const n of list) {
            if (!merged.has(n.name)) merged.set(n.name, n);
          }
        }
        const sorted = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
        setNeighborhoods(sorted);
        setLoadingNeighborhoods(false);
      });
    } else {
      supabase.rpc("get_neighborhoods", { p_province: province, p_district: town }).then(({ data }) => {
        if (data) setNeighborhoods(data as NamePair[]);
        setLoadingNeighborhoods(false);
      });
    }
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
        {/* Province (required) */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Province <span className="text-destructive">*</span></Label>
          <SearchableSelect
            value={province}
            onValueChange={handleProvinceChange}
            options={provinces.map((p) => ({ value: p.name, label: p.name }))}
            placeholder={loadingProvinces ? "Loading..." : "Select Province"}
          />
        </div>

        {/* City/Town (required) */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">City/Town <span className="text-destructive">*</span></Label>
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
              readOnly
              className="bg-secondary/50"
              placeholder={!province || !town ? "Select province & city first" : "Click on map to set pin"}
            />
          </div>
        )}
      </div>

      {/* Interactive Map — only shown when province + town are selected */}
      {showMap && showPinLocation && onPinLocationChange && province && town && (
        <InteractiveMapPicker
          pinLocation={pinLocation}
          onPinLocationChange={onPinLocationChange}
          province={province}
          town={town}
          neighborhoods={neighborhoods}
          onNeighbourhoodChange={onNeighbourhoodChange}
        />
      )}
      {showMap && showPinLocation && onPinLocationChange && (!province || !town) && (
        <div className="h-[280px] rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Select province and city/town to enable map pin placement
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationFormFields;

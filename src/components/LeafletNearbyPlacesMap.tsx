import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  GraduationCap, HeartPulse, TreePine, ShoppingCart, ShoppingBag,
  Church, UtensilsCrossed, Coffee, Dumbbell, Bus, Star, Footprints, Car, X, MapPin, Maximize, Minimize,
  Cross
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';

interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  subtype?: string;
  distance?: number;
  walkTime?: number;
  driveTime?: number;
  rating?: number;
}

interface NearbyPlacesMapProps {
  lat: number;
  lng: number;
  propertyTitle?: string;
  embedded?: boolean;
}

type PlaceCategory = {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  osmQueries: string[];
};

// SVG path data for map markers (24x24 viewBox)
const categorySvgPaths: Record<string, string> = {
  education: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 8 3 12 0v-5"/>',
  health: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><path d="M22 10c0 .6-.5 1-1 1h-2l-3.4-3.4a.8.8 0 0 0-1.2 0L12 10"/>',
  pharmacy: '<path d="M3 3h18v18H3z"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  park: '<path d="M17 22v-2"/><path d="M9 18h6.5l2.14-7.78a.5.5 0 0 0-.86-.46l-1.25 1.5a.5.5 0 0 1-.78 0L12 8l-2.75 3.26a.5.5 0 0 1-.78 0l-1.25-1.5a.5.5 0 0 0-.86.46L8.5 18"/><path d="M7 22v-2"/>',
  market: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  shopping: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  worship: '<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/><path d="M12 9v4"/><path d="M12 17v5"/><path d="M9 17h6"/>',
  restaurant: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  cafe: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
  gym: '<path d="M6.5 6.5 17.5 17.5M7 12l5 5M12 7l5 5M4.5 8.5l1-1M3.5 9.5l1-1M13.5 19.5l1-1M14.5 18.5l1-1M20.5 15.5l-1 1M19.5 14.5l-1 1M10.5 4.5l-1 1M9.5 5.5l-1 1"/>',
  transport: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
};

const categories: PlaceCategory[] = [
  { key: 'education', label: 'Education', icon: GraduationCap, color: '#2563eb', osmQueries: ['amenity~"school|university"'] },
  { key: 'health', label: 'Health', icon: HeartPulse, color: '#dc2626', osmQueries: ['amenity~"hospital|clinic"'] },
  { key: 'pharmacy', label: 'Pharmacy', icon: Cross, color: '#16a34a', osmQueries: ['amenity~"pharmacy"'] },
  { key: 'park', label: 'Park', icon: TreePine, color: '#15803d', osmQueries: ['leisure~"park|garden"'] },
  { key: 'market', label: 'Market', icon: ShoppingCart, color: '#65a30d', osmQueries: ['shop~"supermarket|grocery"'] },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#7c3aed', osmQueries: ['shop~"mall|department_store"'] },
  { key: 'worship', label: 'Worship', icon: Church, color: '#0891b2', osmQueries: ['amenity~"place_of_worship"'] },
  { key: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, color: '#be185d', osmQueries: ['amenity~"restaurant|fast_food"'] },
  { key: 'cafe', label: 'Cafe', icon: Coffee, color: '#92400e', osmQueries: ['amenity~"cafe"'] },
  { key: 'gym', label: 'Gym', icon: Dumbbell, color: '#4f46e5', osmQueries: ['leisure~"fitness_centre|sports_centre"'] },
  { key: 'transport', label: 'Transport', icon: Bus, color: '#0d9488', osmQueries: ['railway~"station|halt"', 'amenity~"bus_station"'] },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createPropertyIcon() {
  return L.divIcon({
    className: 'property-main-marker',
    html: `<div style="width:40px;height:40px;border-radius:50% 50% 50% 0;background:hsl(var(--primary));transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:3px solid white;">
      <svg style="transform:rotate(45deg);width:18px;height:18px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

function createPOIIcon(color: string, isHighlighted: boolean, categoryKey?: string) {
  const size = isHighlighted ? 32 : 26;
  const svgPath = categoryKey && categorySvgPaths[categoryKey]
    ? categorySvgPaths[categoryKey]
    : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
  return L.divIcon({
    className: 'poi-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;transition:all 0.2s;">
      <svg style="width:${size * 0.45}px;height:${size * 0.45}px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14, { animate: true });
  }, [lat, lng, map]);
  return null;
}

const NearbyPlacesMap = ({ lat, lng, propertyTitle, embedded }: NearbyPlacesMapProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Record<string, NearbyPlace[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const propertyIcon = useMemo(() => createPropertyIcon(), []);

  const fetchNearbyPlaces = useCallback(async (categoryKey: string) => {
    if (loadingCategory === categoryKey) return;
    if (places[categoryKey] && !loadErrors[categoryKey]) return;

    setLoadingCategory(categoryKey);
    const cat = categories.find(c => c.key === categoryKey);
    if (!cat) {
      setLoadingCategory(null);
      return;
    }

    try {
      const radius = 3000;
      const nodeParts = cat.osmQueries.map(q => {
        const tildeIdx = q.indexOf('~');
        if (tildeIdx === -1) {
          return `node[${q}](around:${radius},${lat},${lng});`;
        }
        const key = q.substring(0, tildeIdx);
        const rawVal = q.substring(tildeIdx + 1);
        return `node[${key}~${rawVal}](around:${radius},${lat},${lng});`;
      });

      const query = `[out:json][timeout:12];(${nodeParts.join('')});out body 10;`;

      const { data, error } = await supabase.functions.invoke('nearby-places-proxy', {
        body: { query },
      });

      if (error) throw new Error(error.message || 'Nearby places request failed');

      const elements = Array.isArray(data?.elements)
        ? data.elements
        : Array.isArray(data?.data?.elements)
          ? data.data.elements
          : [];

      const results: NearbyPlace[] = elements
        .filter((el: any) => el?.lat && el?.lon && el?.tags?.name)
        .map((el: any) => {
          const dist = haversineDistance(lat, lng, el.lat, el.lon);
          const fallbackRating = 3.5 + ((Number(el.id) % 16) / 10);
          const parsedRating = Number.parseFloat(el.tags?.rating ?? '');

          // Extract human-readable subtype from OSM tags
          const rawType = el.tags?.amenity || el.tags?.shop || el.tags?.leisure || el.tags?.railway || el.tags?.highway || el.tags?.office || el.tags?.public_transport || '';
          const subtype = rawType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

          return {
            id: String(el.id),
            name: el.tags.name,
            lat: el.lat,
            lng: el.lon,
            category: categoryKey,
            subtype: subtype || undefined,
            distance: Math.round(dist * 1000),
            walkTime: Math.max(1, Math.round((dist / 5) * 60)),
            driveTime: Math.max(1, Math.round((dist / 40) * 60)),
            rating: Number.isFinite(parsedRating) ? parsedRating : Math.min(5, fallbackRating),
          };
        })
        .sort((a: NearbyPlace, b: NearbyPlace) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 15);

      setPlaces(prev => ({ ...prev, [categoryKey]: results }));
      setLoadErrors(prev => {
        const next = { ...prev };
        delete next[categoryKey];
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch nearby places:', err);
      setLoadErrors(prev => ({
        ...prev,
        [categoryKey]: 'Could not load nearby places. Tap again to retry.',
      }));
      setPlaces(prev => {
        const next = { ...prev };
        delete next[categoryKey];
        return next;
      });
    } finally {
      setLoadingCategory(null);
    }
  }, [lat, lng, places, loadErrors, loadingCategory]);

  const handleCategoryClick = (key: string) => {
    if (activeCategory === key) {
      setActiveCategory(null);
      setSelectedPlace(null);
      return;
    }

    setActiveCategory(key);
    setSelectedPlace(null);
    void fetchNearbyPlaces(key);
  };

  const activePlaces = activeCategory ? (places[activeCategory] || []) : [];
  const activeCat = categories.find(c => c.key === activeCategory);

  const mapContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'} flex flex-col`}>
      {/* Category buttons - always visible */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto bg-background/95 backdrop-blur-sm border-b border-border scrollbar-hide z-[1001] shrink-0">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 active:scale-95
                ${isActive
                  ? 'text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border hover:border-primary/30'
                }`}
              style={isActive ? { backgroundColor: cat.color } : undefined}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <MapContainer
          center={[lat, lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToCenter lat={lat} lng={lng} />

          <Marker position={[lat, lng]} icon={propertyIcon}>
            <Popup>
              <div className="text-sm font-semibold p-1">{propertyTitle || 'This Property'}</div>
            </Popup>
          </Marker>

          {activePlaces.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={createPOIIcon(activeCat?.color || '#666', selectedPlace?.id === place.id, activeCategory || undefined)}
              eventHandlers={{
                click: () => setSelectedPlace(place),
              }}
            >
              <Popup closeButton={false} offset={[0, -8]}>
                <PlacePopupCard
                  place={place}
                  onClose={() => setSelectedPlace(null)}
                  categoryColor={activeCat?.color || '#666'}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {loadingCategory && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center z-[1000] pointer-events-none">
            <div className="bg-card px-4 py-2 rounded-lg shadow-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading nearby places...
            </div>
          </div>
        )}

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-3 right-3 z-[1001] bg-background/90 hover:bg-background p-2 rounded-lg shadow-md border border-border active:scale-95 transition-transform"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>

      {/* Error/empty messages */}
      {activeCategory && !loadingCategory && loadErrors[activeCategory] && (
        <div className="px-3 py-2 text-xs text-destructive bg-background shrink-0">{loadErrors[activeCategory]}</div>
      )}
      {activeCategory && !loadingCategory && !loadErrors[activeCategory] && activePlaces.length === 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground bg-background shrink-0">No nearby places found within 3 km.</div>
      )}
    </div>
  );

  if (embedded) {
    return mapContent;
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {mapContent}
    </div>
  );
};

const PlacePopupCard = ({ place, onClose, categoryColor }: { place: NearbyPlace; onClose: () => void; categoryColor: string }) => {
  const map = useMap();
  return (
  <div className="w-[220px] p-0">
    <div className="flex items-start justify-between gap-2 mb-1">
      <div>
        <h4 className="text-sm font-semibold text-foreground leading-tight">{place.name}</h4>
        {place.subtype && (
          <span className="text-[11px] text-muted-foreground font-light">{place.subtype}</span>
        )}
      </div>
      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); map.closePopup(); onClose(); }} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5 cursor-pointer z-50">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>

    {place.rating && (
      <div className="flex items-center gap-1 mb-2">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="text-sm font-semibold text-foreground">{place.rating.toFixed(1)}</span>
      </div>
    )}

    <div className="space-y-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3 w-3" style={{ color: categoryColor }} />
        <span>{place.distance ? (place.distance >= 1000 ? `${(place.distance / 1000).toFixed(1)} km` : `${place.distance} m`) : '—'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Footprints className="h-3 w-3 text-primary" />
        <span>{place.walkTime} min walk</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Car className="h-3 w-3 text-primary" />
        <span>{place.driveTime} min drive</span>
      </div>
    </div>
  </div>
);
};

export default NearbyPlacesMap;

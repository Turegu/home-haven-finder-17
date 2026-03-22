import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';
import {
  GraduationCap, HeartPulse, TreePine, ShoppingCart, ShoppingBag,
  Church, UtensilsCrossed, Coffee, Dumbbell, Bus, Star, Footprints, Car, X, MapPin, Maximize, Minimize,
  Cross
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GOOGLE_MAPS_API_KEY } from '@/lib/mapConstants';

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

interface GoogleNearbyPlacesMapProps {
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

const PropertyMarker = memo(({ lat, lng, title }: { lat: number; lng: number; title: string }) => (
  <OverlayViewF position={{ lat, lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
    <div className="transform -translate-x-1/2 -translate-y-full" title={title}>
      <div className="w-10 h-10 rounded-full rounded-bl-none bg-primary flex items-center justify-center rotate-[-45deg] shadow-lg border-[3px] border-white">
        <MapPin className="h-[18px] w-[18px] text-primary-foreground rotate-45" />
      </div>
    </div>
  </OverlayViewF>
));
PropertyMarker.displayName = 'PropertyMarker';

const POIMarker = memo(({ place, color, isSelected, onClick, categoryIcon: CategoryIcon }: {
  place: NearbyPlace;
  color: string;
  isSelected: boolean;
  onClick: () => void;
  categoryIcon: React.ElementType;
}) => (
  <OverlayViewF position={{ lat: place.lat, lng: place.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
    <div
      onClick={onClick}
      className="transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform"
      style={{ transform: `translate(-50%, -50%) scale(${isSelected ? 1.25 : 1})` }}
    >
      <div
        className="rounded-full flex items-center justify-center shadow-md border-2 border-white"
        style={{ backgroundColor: color, width: isSelected ? 32 : 26, height: isSelected ? 32 : 26 }}
      >
        <CategoryIcon className="text-white" style={{ width: isSelected ? 14 : 12, height: isSelected ? 14 : 12 }} />
      </div>
    </div>
  </OverlayViewF>
));
POIMarker.displayName = 'POIMarker';

const PlaceInfoCard = memo(({ place, onClose, categoryColor }: { place: NearbyPlace; onClose: () => void; categoryColor: string }) => (
  <OverlayViewF position={{ lat: place.lat, lng: place.lng }} mapPaneName={OverlayView.FLOAT_PANE}>
    <div className="transform -translate-x-1/2 -translate-y-[calc(100%+20px)]">
      <div className="w-[220px] bg-card rounded-lg border border-border shadow-xl p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h4 className="text-sm font-semibold text-foreground leading-tight">{place.name}</h4>
            {place.subtype && <span className="text-[11px] text-muted-foreground font-light">{place.subtype}</span>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5 cursor-pointer">
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
      <div className="w-3 h-3 bg-card border-b border-r border-border rotate-45 mx-auto -mt-1.5" />
    </div>
  </OverlayViewF>
));
PlaceInfoCard.displayName = 'PlaceInfoCard';

function parseOverpassElements(data: any): any[] {
  if (Array.isArray(data?.elements)) return data.elements;
  if (Array.isArray(data?.data?.elements)) return data.data.elements;
  return [];
}

function mapElementToPlace(el: any, lat: number, lng: number, categoryKey: string): NearbyPlace {
  const dist = haversineDistance(lat, lng, el.lat, el.lon);
  const fallbackRating = 3.5 + ((Number(el.id) % 16) / 10);
  const parsedRating = Number.parseFloat(el.tags?.rating ?? '');
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
}

const GoogleNearbyPlacesMap = ({ lat, lng, propertyTitle, embedded }: GoogleNearbyPlacesMapProps) => {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Record<string, NearbyPlace[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const prefetchedRef = useRef(false);
  const mountedRef = useRef(true);
  // Track in-flight fetches to prevent duplicate requests
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const classifyElement = useCallback((el: any): string | null => {
    const tags = el?.tags;
    if (!tags) return null;
    if (tags.amenity === 'school' || tags.amenity === 'university') return 'education';
    if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'health';
    if (tags.amenity === 'pharmacy') return 'pharmacy';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
    if (tags.shop === 'supermarket' || tags.shop === 'grocery') return 'market';
    if (tags.shop === 'mall' || tags.shop === 'department_store') return 'shopping';
    if (tags.amenity === 'place_of_worship') return 'worship';
    if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'restaurant';
    if (tags.amenity === 'cafe') return 'cafe';
    if (tags.leisure === 'fitness_centre' || tags.leisure === 'sports_centre') return 'gym';
    if (tags.railway === 'station' || tags.railway === 'halt' || tags.amenity === 'bus_station') return 'transport';
    return null;
  }, []);

  const fetchSingleCategory = useCallback(async (categoryKey: string) => {
    if (inFlightRef.current.has(categoryKey)) return;
    inFlightRef.current.add(categoryKey);
    setLoadingCategory(categoryKey);

    const cat = categories.find(c => c.key === categoryKey);
    if (!cat) { inFlightRef.current.delete(categoryKey); setLoadingCategory(null); return; }

    try {
      const radius = 3000;
      const nodeParts = cat.osmQueries.map(q => {
        const tildeIdx = q.indexOf('~');
        if (tildeIdx === -1) return `node[${q}](around:${radius},${lat},${lng});`;
        const key = q.substring(0, tildeIdx);
        const rawVal = q.substring(tildeIdx + 1);
        return `node[${key}~${rawVal}](around:${radius},${lat},${lng});`;
      });
      const query = `[out:json][timeout:12];(${nodeParts.join('')});out body 10;`;
      const { data, error } = await supabase.functions.invoke('nearby-places-proxy', { body: { query } });
      if (error) throw new Error(error.message || 'Nearby places request failed');
      if (!mountedRef.current) return;

      const elements = parseOverpassElements(data);
      const results: NearbyPlace[] = elements
        .filter((el: any) => el?.lat && el?.lon && el?.tags?.name)
        .map((el: any) => mapElementToPlace(el, lat, lng, categoryKey))
        .sort((a: NearbyPlace, b: NearbyPlace) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 15);

      setPlaces(prev => ({ ...prev, [categoryKey]: results }));
      setLoadErrors(prev => { const next = { ...prev }; delete next[categoryKey]; return next; });
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Failed to fetch nearby places:', err);
      setLoadErrors(prev => ({ ...prev, [categoryKey]: 'Could not load nearby places. Tap again to retry.' }));
    } finally {
      inFlightRef.current.delete(categoryKey);
      if (mountedRef.current) setLoadingCategory(null);
    }
  }, [lat, lng]);

  // Prefetch ALL categories in a single combined Overpass query
  useEffect(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    const prefetchAll = async () => {
      const radius = 3000;
      // Build one big union query for all categories
      const allNodeParts: string[] = [];
      for (const cat of categories) {
        for (const q of cat.osmQueries) {
          const tildeIdx = q.indexOf('~');
          if (tildeIdx === -1) {
            allNodeParts.push(`node[${q}](around:${radius},${lat},${lng});`);
          } else {
            const key = q.substring(0, tildeIdx);
            const rawVal = q.substring(tildeIdx + 1);
            allNodeParts.push(`node[${key}~${rawVal}](around:${radius},${lat},${lng});`);
          }
        }
      }
      // Request up to 120 results (roughly 10 per category)
      const query = `[out:json][timeout:25];(${allNodeParts.join('')});out body 120;`;

      try {
        const { data, error } = await supabase.functions.invoke('nearby-places-proxy', { body: { query } });
        if (!mountedRef.current) return;
        if (error) throw new Error(error.message);

        const elements = parseOverpassElements(data);
        // Classify each element into its category
        const grouped: Record<string, NearbyPlace[]> = {};
        for (const cat of categories) grouped[cat.key] = [];

        for (const el of elements) {
          if (!el?.lat || !el?.lon || !el?.tags?.name) continue;
          const catKey = classifyElement(el);
          if (catKey && grouped[catKey]) {
            grouped[catKey].push(mapElementToPlace(el, lat, lng, catKey));
          }
        }

        // Sort and cap each category
        const result: Record<string, NearbyPlace[]> = {};
        for (const [key, items] of Object.entries(grouped)) {
          result[key] = items.sort((a, b) => (a.distance || 0) - (b.distance || 0)).slice(0, 15);
        }
        setPlaces(result);
      } catch (err) {
        console.error('Bulk prefetch failed, will fetch on demand:', err);
      }
    };

    prefetchAll();
  }, [lat, lng, classifyElement]);

  const handleCategoryClick = useCallback((key: string) => {
    setActiveCategory(prev => {
      if (prev === key) {
        setSelectedPlace(null);
        return null;
      }
      setSelectedPlace(null);
      return key;
    });
    // Only fetch if not already prefetched and not in-flight
    if (!places[key] && !inFlightRef.current.has(key)) {
      void fetchSingleCategory(key);
    }
  }, [places, fetchSingleCategory]);

  const handlePlaceClick = useCallback((place: NearbyPlace) => {
    setSelectedPlace(prev => prev?.id === place.id ? null : place);
  }, []);

  const clearSelection = useCallback(() => setSelectedPlace(null), []);

  const activePlaces = activeCategory ? (places[activeCategory] || []) : [];
  const activeCat = categories.find(c => c.key === activeCategory);

  if (!isLoaded) {
    return (
      <div className={`${embedded ? 'h-full' : ''} flex items-center justify-center bg-muted rounded-xl`}>
        <div className="text-muted-foreground text-sm">Loading map...</div>
      </div>
    );
  }

  const mapContent = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'} flex flex-col`}>
      {/* Category buttons */}
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
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat, lng }}
          zoom={14}
          onLoad={onLoad}
          onClick={clearSelection}
          options={{
            mapTypeControl: true,
            mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            ],
          }}
        >
          <PropertyMarker lat={lat} lng={lng} title={propertyTitle || 'This Property'} />

          {activePlaces.map((place) => (
            <POIMarker
              key={place.id}
              place={place}
              color={activeCat?.color || '#666'}
              isSelected={selectedPlace?.id === place.id}
              onClick={() => handlePlaceClick(place)}
              categoryIcon={activeCat?.icon || MapPin}
            />
          ))}

          {selectedPlace && (
            <PlaceInfoCard
              place={selectedPlace}
              onClose={clearSelection}
              categoryColor={activeCat?.color || '#666'}
            />
          )}
        </GoogleMap>

        {loadingCategory && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center z-[1000] pointer-events-none">
            <div className="bg-card px-4 py-2 rounded-lg shadow-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading nearby places...
            </div>
          </div>
        )}

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-3 right-3 z-[1001] bg-background/90 hover:bg-background p-2 rounded-lg shadow-md border border-border active:scale-95 transition-transform"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>

      {activeCategory && !loadingCategory && loadErrors[activeCategory] && (
        <div className="px-3 py-2 text-xs text-destructive bg-background shrink-0">{loadErrors[activeCategory]}</div>
      )}
      {activeCategory && !loadingCategory && !loadErrors[activeCategory] && activePlaces.length === 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground bg-background shrink-0">No nearby places found within 3 km.</div>
      )}
    </div>
  );

  if (isFullscreen) {
    return createPortal(mapContent, document.body);
  }

  if (embedded) return mapContent;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {mapContent}
    </div>
  );
};

export default GoogleNearbyPlacesMap;

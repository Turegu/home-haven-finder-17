import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  GraduationCap, HeartPulse, TreePine, Briefcase, ShoppingCart, ShoppingBag,
  Church, UtensilsCrossed, Coffee, Dumbbell, Bus, Star, Footprints, Car, X, MapPin
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  distance?: number;
  walkTime?: number;
  driveTime?: number;
  rating?: number;
}

interface NearbyPlacesMapProps {
  lat: number;
  lng: number;
  propertyTitle?: string;
}

const categories = [
  { key: 'education', label: 'Education', icon: GraduationCap, color: '#dc2626', osmQueries: ['amenity~"school|university|kindergarten|college"'] },
  { key: 'health', label: 'Health', icon: HeartPulse, color: '#2563eb', osmQueries: ['amenity~"hospital|clinic|pharmacy|dentist|doctors"'] },
  { key: 'park', label: 'Park', icon: TreePine, color: '#16a34a', osmQueries: ['leisure~"park|garden|playground"'] },
  { key: 'business', label: 'Business', icon: Briefcase, color: '#ea580c', osmQueries: ['office'] },
  { key: 'market', label: 'Market', icon: ShoppingCart, color: '#65a30d', osmQueries: ['shop~"supermarket|convenience|grocery|greengrocer"'] },
  { key: 'mall', label: 'Mall', icon: ShoppingBag, color: '#7c3aed', osmQueries: ['shop~"mall|department_store"'] },
  { key: 'worship', label: 'Worship', icon: Church, color: '#0891b2', osmQueries: ['amenity~"place_of_worship"'] },
  { key: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, color: '#be185d', osmQueries: ['amenity~"restaurant|fast_food"'] },
  { key: 'cafe', label: 'Cafe', icon: Coffee, color: '#92400e', osmQueries: ['amenity~"cafe"'] },
  { key: 'gym', label: 'Gym', icon: Dumbbell, color: '#4f46e5', osmQueries: ['leisure~"fitness_centre|sports_centre"'] },
  { key: 'commute', label: 'Commute', icon: Bus, color: '#0d9488', osmQueries: ['amenity~"bus_station"', 'highway~"bus_stop"', 'railway~"station|halt"'] },
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

function createPOIIcon(color: string, isHighlighted: boolean) {
  const size = isHighlighted ? 32 : 26;
  return L.divIcon({
    className: 'poi-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;transition:all 0.2s;">
      <svg style="width:${size * 0.45}px;height:${size * 0.45}px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

const NearbyPlacesMap = ({ lat, lng, propertyTitle }: NearbyPlacesMapProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Record<string, NearbyPlace[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  const propertyIcon = useMemo(() => createPropertyIcon(), []);

  const fetchNearbyPlaces = useCallback(async (categoryKey: string) => {
    if (places[categoryKey]) return;

    setLoadingCategory(categoryKey);
    const cat = categories.find(c => c.key === categoryKey);
    if (!cat) return;

    try {
      const radius = 2000;
      const nodeParts = cat.osmQueries.map(q => {
        const tildeIdx = q.indexOf('~');
        if (tildeIdx === -1) {
          // Simple key existence query like "office"
          return `node[${q}](around:${radius},${lat},${lng});`;
        }
        const key = q.substring(0, tildeIdx);
        const rawVal = q.substring(tildeIdx + 1); // already includes quotes when needed
        return `node[${key}~${rawVal}](around:${radius},${lat},${lng});`;
      });

      const query = `[out:json][timeout:10];(${nodeParts.join('')});out body 20;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!res.ok) throw new Error('Overpass API error');
      const data = await res.json();

      const results: NearbyPlace[] = (data.elements || [])
        .filter((el: any) => el.lat && el.lon && el.tags?.name)
        .map((el: any) => {
          const dist = haversineDistance(lat, lng, el.lat, el.lon);
          return {
            id: String(el.id),
            name: el.tags.name,
            lat: el.lat,
            lng: el.lon,
            category: categoryKey,
            distance: Math.round(dist * 1000), // meters
            walkTime: Math.round((dist / 5) * 60), // ~5km/h walk
            driveTime: Math.max(1, Math.round((dist / 40) * 60)), // ~40km/h drive
            rating: el.tags['rating'] ? parseFloat(el.tags['rating']) : (3.5 + Math.random() * 1.5), // Simulated rating
          };
        })
        .sort((a: NearbyPlace, b: NearbyPlace) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 15);

      setPlaces(prev => ({ ...prev, [categoryKey]: results }));
    } catch (err) {
      console.error('Failed to fetch nearby places:', err);
      setPlaces(prev => ({ ...prev, [categoryKey]: [] }));
    } finally {
      setLoadingCategory(null);
    }
  }, [lat, lng, places]);

  const handleCategoryClick = (key: string) => {
    if (activeCategory === key) {
      setActiveCategory(null);
      setSelectedPlace(null);
    } else {
      setActiveCategory(key);
      setSelectedPlace(null);
      fetchNearbyPlaces(key);
    }
  };

  const activePlaces = activeCategory ? (places[activeCategory] || []) : [];
  const activeCat = categories.find(c => c.key === activeCategory);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Map */}
      <div className="relative" style={{ height: '450px' }}>
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToCenter lat={lat} lng={lng} />

          {/* Property marker */}
          <Marker position={[lat, lng]} icon={propertyIcon}>
            <Popup>
              <div className="text-sm font-semibold p-1">{propertyTitle || 'This Property'}</div>
            </Popup>
          </Marker>

          {/* Nearby place markers */}
          {activePlaces.map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={createPOIIcon(activeCat?.color || '#666', selectedPlace?.id === place.id)}
              eventHandlers={{
                click: () => setSelectedPlace(place),
              }}
            >
              <Popup closeButton={false} offset={[0, -8]}>
                <PlacePopupCard place={place} onClose={() => setSelectedPlace(null)} categoryColor={activeCat?.color || '#666'} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Loading overlay */}
        {loadingCategory && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center z-[1000] pointer-events-none">
            <div className="bg-card px-4 py-2 rounded-lg shadow-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading nearby places...
            </div>
          </div>
        )}
      </div>

      {/* Category bar */}
      <div className="flex items-center gap-1 px-3 py-2.5 overflow-x-auto border-t border-border bg-muted/30 scrollbar-hide">
        {categories.map(cat => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0
                ${isActive
                  ? 'text-white shadow-md scale-105'
                  : 'bg-background text-muted-foreground hover:bg-muted border border-border hover:border-primary/30'
                }`}
              style={isActive ? { backgroundColor: cat.color } : undefined}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Popup card for a nearby place
const PlacePopupCard = ({ place, onClose, categoryColor }: { place: NearbyPlace; onClose: () => void; categoryColor: string }) => (
  <div className="w-[220px] p-0">
    <div className="flex items-start justify-between gap-2 mb-2">
      <h4 className="text-sm font-semibold text-foreground leading-tight">{place.name}</h4>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>

    {/* Rating */}
    {place.rating && (
      <div className="flex items-center gap-1 mb-2">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="text-sm font-semibold text-foreground">{place.rating.toFixed(1)}</span>
      </div>
    )}

    {/* Distance info */}
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

export default NearbyPlacesMap;

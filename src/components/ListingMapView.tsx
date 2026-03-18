import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Building, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// City coordinate lookup for mock data
const cityCoords: Record<string, [number, number]> = {
  'dubai': [25.2048, 55.2708],
  'istanbul': [41.0082, 28.9784],
  'abu dhabi': [24.4539, 54.3773],
  'ankara': [39.9334, 32.8597],
  'sharjah': [25.3462, 55.4211],
  'antalya': [36.8969, 30.7133],
  'nevşehir': [38.6244, 34.7239],
  'gaziantep': [37.0662, 37.3833],
};

function getCityFromLocation(location: string): [number, number] {
  const lower = location.toLowerCase();
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (lower.includes(city)) return coords;
  }
  // Default: Turkey center with slight random offset
  return [39.0 + Math.random() * 2, 32.0 + Math.random() * 4];
}

export interface MapListing {
  id: string;
  title: string;
  location: string;
  image: string;
  price: number | null;
  currency: string;
  linkTo: string;
  type: 'property' | 'project' | 'event';
  subtitle?: string;
  meta?: string;
  logo?: string;
}

// Create price badge marker
function createPriceIcon(price: number | null, currency: string) {
  const label = price ? `${currency === 'USD' ? '$' : currency} ${price >= 1000000 ? (price / 1000000).toFixed(1) + 'M' : price >= 1000 ? Math.round(price / 1000) + 'K' : price.toLocaleString()}` : 'Free';
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background: hsl(var(--primary)); color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; border: 2px solid white;">${label}</div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 30],
  });
}

// Popup card component
const ListingPopupCard = ({ listing, onClose }: { listing: MapListing; onClose: () => void }) => (
  <div className="w-[280px] bg-card rounded-lg overflow-hidden shadow-xl border border-border">
    <div className="relative">
      <img src={listing.image} alt={listing.title} className="w-full h-[160px] object-cover" />
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-2 right-2 bg-background/90 hover:bg-background rounded-full p-1 shadow"
      >
        <X className="h-4 w-4 text-foreground" />
      </button>
    </div>
    <div className="p-3">
      <Link to={listing.linkTo}>
        <h4 className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 mb-1">
          {listing.title}
        </h4>
      </Link>
      {listing.subtitle && (
        <p className="text-xs text-muted-foreground mb-1">{listing.subtitle}</p>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
        <MapPin className="h-3 w-3 text-primary shrink-0" />
        <span className="line-clamp-1">{listing.location}</span>
      </div>
      {listing.meta && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Building className="h-3 w-3" />
          <span>{listing.meta}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {listing.logo && (
          <img src={listing.logo} alt="" className="h-8 w-12 object-contain rounded border border-border" />
        )}
        <span className="text-sm font-bold text-foreground ml-auto">
          {listing.price
            ? `${listing.type === 'project' ? 'Starting From ' : ''}${listing.currency === 'USD' ? '$' : listing.currency} ${listing.price.toLocaleString()}`
            : 'Open Invitation'}
        </span>
      </div>
    </div>
  </div>
);

// Auto-fit map bounds
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useMemo(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [positions, map]);
  return null;
}

interface ListingMapViewProps {
  listings: MapListing[];
  className?: string;
}

const ListingMapView = ({ listings, className = '' }: ListingMapViewProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listingsWithCoords = useMemo(() =>
    listings.map(l => ({
      ...l,
      coords: getCityFromLocation(l.location),
    })),
    [listings]
  );

  const positions = listingsWithCoords.map(l => l.coords);
  const center: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p[0], 0) / positions.length, positions.reduce((s, p) => s + p[1], 0) / positions.length]
    : [39.0, 35.0];

  return (
    <div className={`rounded-xl border border-border overflow-hidden ${className}`} style={{ height: '600px' }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {listingsWithCoords.map((listing) => (
          <Marker
            key={listing.id}
            position={listing.coords}
            icon={createPriceIcon(listing.price, listing.currency)}
            eventHandlers={{
              click: () => setSelectedId(listing.id === selectedId ? null : listing.id),
            }}
          >
            {selectedId === listing.id && (
              <Popup
                closeButton={false}
                offset={[0, -10]}
                className="listing-map-popup"
              >
                <ListingPopupCard
                  listing={listing}
                  onClose={() => setSelectedId(null)}
                />
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ListingMapView;

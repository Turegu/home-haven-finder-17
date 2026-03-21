import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Building, X, ChevronLeft, ChevronRight, Heart, Layers, Maximize, Camera, BedDouble, Bath } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useAreaUnit } from '@/hooks/useAreaUnit';
import { useAllowedCountry } from '@/hooks/useAllowedCountry';
import { getCountryMapConfig } from '@/lib/mapConstants';

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
  return [39.0 + Math.random() * 2, 32.0 + Math.random() * 4];
}

export interface MapListing {
  id: string;
  title: string;
  location: string;
  image: string;
  images?: string[];
  price: number | null;
  currency: string;
  linkTo: string;
  type: 'property' | 'project' | 'event';
  subtitle?: string;
  meta?: string;
  logo?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: string;
  propertyType?: string;
  units?: number;
  rentDuration?: string | null;
}

function getRentSuffix(rentDuration?: string | null): string {
  if (!rentDuration) return '/mo';
  switch (rentDuration) {
    case 'Daily': return '/day';
    case 'Weekly': return '/wk';
    case 'Yearly': return '/yr';
    default: return '/mo';
  }
}

// Create price badge marker
function createPriceIcon(price: number | null, currency: string, rentDuration?: string | null) {
  let label = price ? `${currency === 'USD' ? '$' : `${currency} `}${price.toLocaleString()}` : 'Free';
  if (price && rentDuration) label += getRentSuffix(rentDuration);
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="background: #009688; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; border: 2px solid #009688;">${label}</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #009688;margin-top:-1px;"></div></div>`,
    iconSize: [80, 36],
    iconAnchor: [40, 36],
  });
}

// Grid-style popup card with smaller thumbnail
const ListingPopupCard = ({ listing, onClose }: { listing: MapListing; onClose: () => void }) => {
  const allImages = listing.images?.length ? listing.images : [listing.image];
  const [imgIdx, setImgIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const { formatArea } = useAreaUnit();
  const touchStartX = useRef<number | null>(null);
...
  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Contact for Price';
    const sym = currency === 'USD' ? '$' : currency + ' ';
    return `${sym}${price.toLocaleString()}`;
  };

  return (
    <div className="w-[240px] bg-card rounded-xl border border-border overflow-hidden shadow-lg">
      <div className="relative aspect-[2/1] overflow-hidden bg-muted group"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex h-full transition-transform duration-300 ease-in-out" style={{ width: `${allImages.length * 100}%`, transform: `translateX(-${imgIdx * (100 / allImages.length)}%)` }}>
          {allImages.map((src, i) => (
            <img key={i} src={src} alt={listing.title} className="h-full object-cover shrink-0" style={{ width: `${100 / allImages.length}%` }} />
          ))}
        </div>
        {allImages.length > 1 && (
          <>
            <button onClick={prevImg}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={nextImg}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setImgIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {/* Photo count */}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-foreground/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
          <Camera className="h-2.5 w-2.5" />
          <span>{imgIdx + 1}/{allImages.length}</span>
        </div>

        {/* Close button - top left */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-1.5 left-1.5 bg-background/90 hover:bg-background text-foreground/70 hover:text-primary p-1 rounded-full transition-colors shadow-sm z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Action buttons - top right */}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="bg-background/90 hover:bg-background text-foreground/70 hover:text-primary p-1 rounded-full transition-colors shadow-sm"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited); }}
            className={`p-1 rounded-full transition-colors shadow-sm ${
              isFavorited
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/90 hover:bg-background text-foreground/70 hover:text-destructive'
            }`}
          >
            <Heart className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Company Logo */}
        {listing.logo && (
          <div className="absolute bottom-1.5 right-1.5">
            <img
              src={listing.logo}
              alt=""
              className="h-8 w-11 rounded border border-background object-cover shadow-md bg-background"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Price */}
        <div className="text-sm font-bold text-foreground mb-0.5">
          {formatPrice(listing.price, listing.currency)}{listing.rentDuration && <span className="text-xs font-normal text-muted-foreground">{getRentSuffix(listing.rentDuration)}</span>}
        </div>

        {/* Title */}
        <Link to={listing.linkTo}>
          <h4 className="text-xs font-medium text-foreground/90 hover:text-primary transition-colors line-clamp-1 mb-1.5">
            {listing.title}
          </h4>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-2">
          <MapPin className="h-3 w-3 shrink-0 text-primary" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>

        {/* Specs Row */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-border">
          {listing.propertyType && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <Building className="h-3 w-3" />
              <span>{listing.propertyType}</span>
            </div>
          )}
          {listing.area && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <Maximize className="h-3 w-3" />
              <span>{formatArea(listing.area, listing.areaUnit || 'm²')}</span>
            </div>
          )}
          {listing.bedrooms != null && listing.bedrooms > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <BedDouble className="h-3 w-3" />
              <span>{listing.bedrooms}</span>
            </div>
          )}
          {listing.bathrooms != null && listing.bathrooms > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <Bath className="h-3 w-3" />
              <span>{listing.bathrooms}</span>
            </div>
          )}
          {listing.units && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <Building className="h-3 w-3" />
              <span>{listing.units} Units</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Auto-fit map bounds
function FitBounds({ positions, countryBounds }: { positions: [number, number][]; countryBounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useMemo(() => {
    // Always include country bounds so full country is visible
    const bounds = L.latLngBounds(
      L.latLng(countryBounds[0][0], countryBounds[0][1]),
      L.latLng(countryBounds[1][0], countryBounds[1][1])
    );
    // Extend with listing positions if any
    positions.forEach(p => bounds.extend(L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [positions, map, countryBounds]);
  return null;
}

// Component to auto-open a specific marker's popup
function FocusMarker({ focusId, markerRefs }: { focusId: string | null; markerRefs: React.MutableRefObject<Record<string, L.Marker>> }) {
  const map = useMap();
  useEffect(() => {
    if (!focusId) return;
    const marker = markerRefs.current[focusId];
    if (marker) {
      const latlng = marker.getLatLng();
      map.setView(latlng, 12, { animate: true });
      setTimeout(() => marker.openPopup(), 400);
    }
  }, [focusId, map, markerRefs]);
  return null;
}

interface ListingMapViewProps {
  listings: MapListing[];
  className?: string;
  focusListingId?: string | null;
}

const ListingMapView = ({ listings, className = '', focusListingId = null }: ListingMapViewProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const { data: allowedCountry = 'Turkey' } = useAllowedCountry();
  const countryConfig = getCountryMapConfig(allowedCountry);

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
    : [countryConfig.center.lat, countryConfig.center.lng];

  return (
    <div className={`rounded-xl border border-border overflow-hidden ${className}`} style={{ height: '600px' }}>
      <MapContainer
        center={center}
        zoom={countryConfig.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} countryBounds={countryConfig.bounds} />
        <FocusMarker focusId={focusListingId} markerRefs={markerRefs} />
        {listingsWithCoords.map((listing) => (
          <Marker
            key={listing.id}
            position={listing.coords}
            icon={createPriceIcon(listing.price, listing.currency, listing.rentDuration)}
            ref={(ref) => { if (ref) markerRefs.current[listing.id] = ref; }}
            eventHandlers={{
              click: () => setSelectedId(listing.id === selectedId ? null : listing.id),
            }}
          >
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
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ListingMapView;

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { MapPin, Building, X, ChevronLeft, ChevronRight, Heart, Layers, Maximize, Camera, BedDouble, Bath } from 'lucide-react';
import type { MapListing } from './LeafletListingMapView';
import { GOOGLE_MAPS_API_KEY, getCoordsFromLocation, getCountryMapConfig } from '@/lib/mapConstants';
import { useAreaUnit } from '@/hooks/useAreaUnit';
import { useAllowedCountry } from '@/hooks/useAllowedCountry';

function getRentSuffix(rentDuration?: string | null): string {
  const normalized = rentDuration?.trim().toLowerCase();
  if (!normalized || normalized.includes('month')) return '/mo';
  if (normalized.includes('day')) return '/day';
  if (normalized.includes('week')) return '/wk';
  if (normalized.includes('year') || normalized.includes('annual')) return '/yr';
  return '/mo';
}

function formatPrice(price: number | null, currency: string) {
  if (!price) return 'Contact for Price';
  const sym = currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${price.toLocaleString()}`;
}

function formatPriceShort(price: number | null, currency: string, rentDuration?: string | null, isRentListing = false) {
  if (!price) return 'Free';
  const sym = currency === 'USD' ? '$' : currency + ' ';
  let base = `${sym}${price.toLocaleString()}`;
  if (isRentListing) base += getRentSuffix(rentDuration);
  return base;
}

// Price badge marker overlay
const PriceMarker = ({ listing, isSelected, onClick }: { listing: MapListing & { coords: { lat: number; lng: number } }; isSelected: boolean; onClick: () => void }) => (
  <OverlayViewF
    position={listing.coords}
    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
  >
    <div className="flex flex-col items-center transform -translate-x-1/2 -translate-y-full"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div
        className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer border-2 transition-all shadow-md ${
          isSelected
            ? 'bg-foreground text-background border-foreground scale-110'
            : 'bg-primary text-primary-foreground border-primary hover:scale-105'
        }`}
      >
        {formatPriceShort(
          listing.price,
          listing.currency,
          listing.rentDuration,
          listing.type === 'property' && listing.listingType === 'rent'
        )}
      </div>
      <div className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent -mt-px ${
        isSelected ? 'border-t-foreground' : 'border-t-primary'
      }`} />
    </div>
  </OverlayViewF>
);

// Popup card
const PopupCard = ({ listing, onClose }: { listing: MapListing; onClose: () => void }) => {
  const allImages = listing.images?.length ? listing.images : [listing.image];
  const [imgIdx, setImgIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const { formatArea } = useAreaUnit();
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      setImgIdx(i => diff < 0 ? (i + 1) % allImages.length : (i - 1 + allImages.length) % allImages.length);
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-[240px] bg-card rounded-xl border border-border overflow-hidden shadow-xl">
      <div className="relative aspect-[2/1] overflow-hidden bg-muted group"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex h-full transition-transform duration-300 ease-in-out" style={{ width: `${allImages.length * 100}%`, transform: `translateX(-${imgIdx * (100 / allImages.length)}%)` }}>
          {allImages.map((src, i) => (
            <img key={i} src={src} alt={listing.title} className="h-full object-cover shrink-0" style={{ width: `${100 / allImages.length}%` }} />
          ))}
        </div>
        {allImages.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + allImages.length) % allImages.length); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % allImages.length); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-foreground/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
          <Camera className="h-2.5 w-2.5" /><span>{imgIdx + 1}/{allImages.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-1.5 left-1.5 bg-background/90 hover:bg-background text-foreground/70 hover:text-primary p-1 rounded-full transition-colors shadow-sm z-10">
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button onClick={(e) => e.stopPropagation()} className="bg-background/90 hover:bg-background text-foreground/70 hover:text-primary p-1 rounded-full transition-colors shadow-sm">
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited); }}
            className={`p-1 rounded-full transition-colors shadow-sm ${isFavorited ? 'bg-primary text-primary-foreground' : 'bg-background/90 hover:bg-background text-foreground/70 hover:text-destructive'}`}>
            <Heart className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
        {listing.logo && (
          <div className="absolute bottom-1.5 right-1.5">
            <img src={listing.logo} alt="" className="h-8 w-11 rounded border border-background object-cover shadow-md bg-background" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-foreground mb-0.5">{formatPrice(listing.price, listing.currency)}{listing.type === 'property' && listing.listingType === 'rent' && <span className="text-xs font-normal text-muted-foreground">{getRentSuffix(listing.rentDuration)}</span>}</div>
        <Link to={listing.linkTo}>
          <h4 className="text-xs font-medium text-foreground/90 hover:text-primary transition-colors line-clamp-1 mb-1.5">{listing.title}</h4>
        </Link>
        <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-2">
          <MapPin className="h-3 w-3 shrink-0 text-primary" /><span className="line-clamp-1">{listing.location}</span>
        </div>
        <div className="flex items-center gap-2.5 pt-2 border-t border-border">
          {listing.propertyType && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Building className="h-3 w-3" /><span>{listing.propertyType}</span></div>}
          {listing.area && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Maximize className="h-3 w-3" /><span>{formatArea(listing.area, listing.areaUnit || 'm²')}</span></div>}
          {listing.bedrooms != null && listing.bedrooms > 0 && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><BedDouble className="h-3 w-3" /><span>{listing.bedrooms}</span></div>}
          {listing.bathrooms != null && listing.bathrooms > 0 && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Bath className="h-3 w-3" /><span>{listing.bathrooms}</span></div>}
          {listing.units && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Building className="h-3 w-3" /><span>{listing.units} Units</span></div>}
        </div>
      </div>
    </div>
  );
};

function parsePinLocation(pin?: string | null): { lat: number; lng: number } | null {
  if (!pin) return null;
  const parts = pin.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

function getGoogleListingCoords(listing: MapListing): { lat: number; lng: number } {
  const pin = parsePinLocation(listing.pinLocation);
  if (pin) return pin;
  return getCoordsFromLocation(listing.location);
}

// Fetch district boundary from Nominatim
async function fetchGoogleBoundary(province: string, district: string): Promise<google.maps.LatLng[][] | null> {
  const queries = [
    `https://nominatim.openstreetmap.org/search?county=${encodeURIComponent(district)}&state=${encodeURIComponent(province)}&country=Turkey&format=json&polygon_geojson=1&limit=1&accept-language=en,tr`,
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${district} district, ${province}, Turkey`)}&format=json&polygon_geojson=1&limit=1&accept-language=en,tr`,
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${district}, ${province}`)}&format=json&polygon_geojson=1&limit=1&accept-language=en,tr`,
  ];

  for (const url of queries) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'LovableRealEstate/1.0' } });
      if (!res.ok) continue;
      const data = await res.json();
      const geo = data?.[0]?.geojson;
      if (!geo || geo.type === 'Point') continue;

      let rings: number[][][] = [];
      if (geo.type === 'Polygon') rings = geo.coordinates;
      else if (geo.type === 'MultiPolygon') {
        for (const poly of geo.coordinates) rings.push(...poly);
      }

      if (rings.length > 0) {
        return rings.map(ring =>
          ring.map(coord => new google.maps.LatLng(coord[1], coord[0]))
        );
      }
    } catch { /* continue */ }
  }
  return null;
}

interface GoogleListingMapViewProps {
  listings: MapListing[];
  className?: string;
  focusListingId?: string | null;
  selectedProvince?: string;
  selectedDistrict?: string;
}

const GoogleListingMapView = ({ listings, className = '', focusListingId = null, selectedProvince, selectedDistrict }: GoogleListingMapViewProps) => {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundaryRef = useRef<google.maps.Polygon[]>([]);
  const { data: allowedCountry = 'Turkey' } = useAllowedCountry();
  const countryConfig = getCountryMapConfig(allowedCountry);

  const listingsWithCoords = useMemo(() =>
    listings.map(l => ({ ...l, coords: getGoogleListingCoords(l) })),
    [listings]
  );

  const center = useMemo(() => {
    if (listingsWithCoords.length === 0) return countryConfig.center;
    const avg = listingsWithCoords.reduce((acc, l) => ({ lat: acc.lat + l.coords.lat, lng: acc.lng + l.coords.lng }), { lat: 0, lng: 0 });
    return { lat: avg.lat / listingsWithCoords.length, lng: avg.lng / listingsWithCoords.length };
  }, [listingsWithCoords, countryConfig]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Always include country bounds so full country is visible
    const cb = countryConfig.bounds;
    const bounds = new google.maps.LatLngBounds(
      { lat: cb[0][0], lng: cb[0][1] },
      { lat: cb[1][0], lng: cb[1][1] }
    );
    // Extend with listing positions if any
    listingsWithCoords.forEach(l => bounds.extend(l.coords));
    map.fitBounds(bounds, 50);
  }, [listingsWithCoords, countryConfig]);

  // Draw district boundary on Google Maps
  useEffect(() => {
    // Clear old boundaries
    boundaryRef.current.forEach(p => p.setMap(null));
    boundaryRef.current = [];

    if (!selectedProvince || !selectedDistrict || !mapRef.current || !isLoaded) return;

    fetchGoogleBoundary(selectedProvince, selectedDistrict).then(rings => {
      if (!rings || !mapRef.current) return;

      const bounds = new google.maps.LatLngBounds();
      rings.forEach(ring => {
        const poly = new google.maps.Polygon({
          paths: ring,
          strokeColor: '#2563eb',
          strokeWeight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
        });
        poly.setMap(mapRef.current);
        boundaryRef.current.push(poly);
        ring.forEach(pt => bounds.extend(pt));
      });
      mapRef.current.fitBounds(bounds, 30);
    });
  }, [selectedProvince, selectedDistrict, isLoaded]);

  // Focus on a specific listing
  useEffect(() => {
    if (!focusListingId || !mapRef.current) return;
    const listing = listingsWithCoords.find(l => l.id === focusListingId);
    if (listing) {
      mapRef.current.panTo(listing.coords);
      mapRef.current.setZoom(12);
      setTimeout(() => setSelectedId(focusListingId), 400);
    }
  }, [focusListingId, listingsWithCoords]);

  const selectedListing = listingsWithCoords.find(l => l.id === selectedId);

  if (!isLoaded) {
    return (
      <div className={`rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center ${className}`} style={{ height: '600px' }}>
        <div className="text-muted-foreground text-sm">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border overflow-hidden ${className}`} style={{ height: '600px' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={6}
        onLoad={onLoad}
        onClick={() => setSelectedId(null)}
        options={{
          mapTypeControl: true,
          mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {listingsWithCoords.map(listing => (
          <PriceMarker
            key={listing.id}
            listing={listing}
            isSelected={selectedId === listing.id}
            onClick={() => setSelectedId(listing.id === selectedId ? null : listing.id)}
          />
        ))}

        {selectedListing && (
          <OverlayViewF
            position={selectedListing.coords}
            mapPaneName={OverlayView.FLOAT_PANE}
          >
            <div className="transform -translate-x-1/2 -translate-y-[calc(100%+40px)]" onClick={(e) => e.stopPropagation()}>
              <PopupCard listing={selectedListing} onClose={() => setSelectedId(null)} />
              <div className="w-3 h-3 bg-card border-b border-r border-border rotate-45 mx-auto -mt-1.5" />
            </div>
          </OverlayViewF>
        )}
      </GoogleMap>
    </div>
  );
};

export default GoogleListingMapView;

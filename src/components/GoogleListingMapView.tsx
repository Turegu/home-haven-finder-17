import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { MapPin, Building, X, ChevronLeft, ChevronRight, Heart, Layers, Maximize, Camera, BedDouble, Bath } from 'lucide-react';
import type { MapListing } from './LeafletListingMapView';
import { GOOGLE_MAPS_API_KEY, getCoordsFromLocation } from '@/lib/mapConstants';
import { useAreaUnit } from '@/hooks/useAreaUnit';

function formatPrice(price: number | null, currency: string) {
  if (!price) return 'Contact for Price';
  const sym = currency === 'USD' ? '$' : currency + ' ';
  if (price >= 1000000) return `${sym}${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${sym}${Math.round(price / 1000)}K`;
  return `${sym}${price.toLocaleString()}`;
}

function formatPriceShort(price: number | null, currency: string) {
  if (!price) return 'Free';
  const sym = currency === 'USD' ? '$' : currency + ' ';
  if (price >= 1000000) return `${sym}${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${sym}${Math.round(price / 1000)}K`;
  return `${sym}${price.toLocaleString()}`;
}

// Price badge marker overlay
const PriceMarker = ({ listing, isSelected, onClick }: { listing: MapListing & { coords: { lat: number; lng: number } }; isSelected: boolean; onClick: () => void }) => (
  <OverlayViewF
    position={listing.coords}
    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
  >
    <div
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer border-2 transition-all transform -translate-x-1/2 -translate-y-full shadow-md ${
        isSelected
          ? 'bg-foreground text-background border-foreground scale-110'
          : 'bg-primary text-primary-foreground border-white hover:scale-105'
      }`}
    >
      {formatPriceShort(listing.price, listing.currency)}
    </div>
  </OverlayViewF>
);

// Popup card
const PopupCard = ({ listing, onClose }: { listing: MapListing; onClose: () => void }) => {
  const allImages = listing.images?.length ? listing.images : [listing.image];
  const [imgIdx, setImgIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="w-[240px] bg-card rounded-xl border border-border overflow-hidden shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted group">
        <img src={allImages[imgIdx]} alt={listing.title} className="w-full h-full object-cover" />
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
        <div className="text-sm font-bold text-foreground mb-0.5">{formatPrice(listing.price, listing.currency)}</div>
        <Link to={listing.linkTo}>
          <h4 className="text-xs font-medium text-foreground/90 hover:text-primary transition-colors line-clamp-1 mb-1.5">{listing.title}</h4>
        </Link>
        <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-2">
          <MapPin className="h-3 w-3 shrink-0 text-primary" /><span className="line-clamp-1">{listing.location}</span>
        </div>
        <div className="flex items-center gap-2.5 pt-2 border-t border-border">
          {listing.propertyType && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Building className="h-3 w-3" /><span>{listing.propertyType}</span></div>}
          {listing.area && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Maximize className="h-3 w-3" /><span>{listing.area} {listing.areaUnit || 'sqm'}</span></div>}
          {listing.bedrooms != null && listing.bedrooms > 0 && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><BedDouble className="h-3 w-3" /><span>{listing.bedrooms}</span></div>}
          {listing.bathrooms != null && listing.bathrooms > 0 && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Bath className="h-3 w-3" /><span>{listing.bathrooms}</span></div>}
          {listing.units && <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Building className="h-3 w-3" /><span>{listing.units} Units</span></div>}
        </div>
      </div>
    </div>
  );
};

interface GoogleListingMapViewProps {
  listings: MapListing[];
  className?: string;
  focusListingId?: string | null;
}

const GoogleListingMapView = ({ listings, className = '', focusListingId = null }: GoogleListingMapViewProps) => {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const listingsWithCoords = useMemo(() =>
    listings.map(l => ({ ...l, coords: getCoordsFromLocation(l.location) })),
    [listings]
  );

  const center = useMemo(() => {
    if (listingsWithCoords.length === 0) return { lat: 39.0, lng: 35.0 };
    const avg = listingsWithCoords.reduce((acc, l) => ({ lat: acc.lat + l.coords.lat, lng: acc.lng + l.coords.lng }), { lat: 0, lng: 0 });
    return { lat: avg.lat / listingsWithCoords.length, lng: avg.lng / listingsWithCoords.length };
  }, [listingsWithCoords]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (listingsWithCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      listingsWithCoords.forEach(l => bounds.extend(l.coords));
      map.fitBounds(bounds, 50);
    }
  }, [listingsWithCoords]);

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
            <div className="transform -translate-x-1/2 -translate-y-[calc(100%+40px)]">
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

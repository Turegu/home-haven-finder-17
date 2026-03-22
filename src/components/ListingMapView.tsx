import { lazy, Suspense } from 'react';
import { useMapProvider } from '@/hooks/useMapProvider';

// Re-export the interface
export type { MapListing } from './LeafletListingMapView';

const LeafletListingMapView = lazy(() => import('./LeafletListingMapView'));
const GoogleListingMapView = lazy(() => import('./GoogleListingMapView'));

interface ListingMapViewProps {
  listings: import('./LeafletListingMapView').MapListing[];
  className?: string;
  focusListingId?: string | null;
  selectedProvince?: string;
  selectedDistrict?: string;
}

const MapFallback = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center ${className}`} style={{ height: '600px' }}>
    <div className="text-muted-foreground text-sm">Loading map...</div>
  </div>
);

const ListingMapView = ({ listings, className = '', focusListingId = null, selectedProvince, selectedDistrict }: ListingMapViewProps) => {
  const { data: provider = 'google' } = useMapProvider();

  return (
    <Suspense fallback={<MapFallback className={className} />}>
      {provider === 'google' ? (
        <GoogleListingMapView listings={listings} className={className} focusListingId={focusListingId} selectedProvince={selectedProvince} selectedDistrict={selectedDistrict} />
      ) : (
        <LeafletListingMapView listings={listings} className={className} focusListingId={focusListingId} selectedProvince={selectedProvince} selectedDistrict={selectedDistrict} />
      )}
    </Suspense>
  );
};

export default ListingMapView;

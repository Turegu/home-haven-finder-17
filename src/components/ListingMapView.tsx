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
}

const MapFallback = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center ${className}`} style={{ height: '600px' }}>
    <div className="text-muted-foreground text-sm">Loading map...</div>
  </div>
);

const ListingMapView = ({ listings, className = '', focusListingId = null }: ListingMapViewProps) => {
  const { data: provider = 'google' } = useMapProvider();

  return (
    <Suspense fallback={<MapFallback className={className} />}>
      {provider === 'google' ? (
        <GoogleListingMapView listings={listings} className={className} focusListingId={focusListingId} />
      ) : (
        <LeafletListingMapView listings={listings} className={className} focusListingId={focusListingId} />
      )}
    </Suspense>
  );
};

export default ListingMapView;

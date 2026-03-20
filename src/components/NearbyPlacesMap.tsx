import { lazy, Suspense } from 'react';
import { useMapProvider } from '@/hooks/useMapProvider';

const LeafletNearbyPlacesMap = lazy(() => import('./LeafletNearbyPlacesMap'));
const GoogleNearbyPlacesMap = lazy(() => import('./GoogleNearbyPlacesMap'));

interface NearbyPlacesMapProps {
  lat: number;
  lng: number;
  propertyTitle?: string;
  embedded?: boolean;
}

const MapFallback = () => (
  <div className="h-full flex items-center justify-center bg-muted rounded-xl">
    <div className="text-muted-foreground text-sm">Loading map...</div>
  </div>
);

const NearbyPlacesMap = (props: NearbyPlacesMapProps) => {
  const { data: provider = 'google' } = useMapProvider();

  return (
    <Suspense fallback={<MapFallback />}>
      {provider === 'google' ? (
        <GoogleNearbyPlacesMap {...props} />
      ) : (
        <LeafletNearbyPlacesMap {...props} />
      )}
    </Suspense>
  );
};

export default NearbyPlacesMap;

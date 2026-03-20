import { useState, useEffect } from 'react';
import { PersonStanding, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapillaryStreetViewProps {
  lat: number;
  lng: number;
  className?: string;
}

const MapillaryStreetView = ({ lat, lng, className = '' }: MapillaryStreetViewProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the Mapillary access token from admin_settings
  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'mapillary_access_token')
        .single();

      if (data?.setting_value) {
        setAccessToken(data.setting_value);
      } else {
        setError('Street View is not configured yet.');
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Find nearest Mapillary image to the coordinates
  useEffect(() => {
    if (!accessToken) return;

    const findNearbyImage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Mapillary API v4 to search for images near coordinates
        const bbox = `${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}`;
        const url = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,geometry,captured_at,compass_angle&bbox=${bbox}&limit=1`;

        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            setError('Invalid Mapillary access token. Please update it in admin settings.');
          } else {
            setError('Could not fetch street view data.');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setImageId(data.data[0].id);
        } else {
          // Try with a wider bounding box (~1km)
          const widerBbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
          const widerUrl = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,geometry&bbox=${widerBbox}&limit=1`;
          const widerResponse = await fetch(widerUrl);

          if (widerResponse.ok) {
            const widerData = await widerResponse.json();
            if (widerData.data && widerData.data.length > 0) {
              setImageId(widerData.data[0].id);
            } else {
              setError('No street-level imagery available for this location.');
            }
          } else {
            setError('No street-level imagery available for this location.');
          }
        }
      } catch {
        setError('Failed to load street view. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    findNearbyImage();
  }, [accessToken, lat, lng]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading street view…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground max-w-xs text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!imageId) return null;

  const embedUrl = `https://www.mapillary.com/embed?image_key=${imageId}&style=photo`;
  const mapillaryLink = `https://www.mapillary.com/app/?pKey=${imageId}`;

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={embedUrl}
        title="Street View"
        className="w-full h-full border-0"
        allowFullScreen
      />

      {/* Mapillary attribution + open in full */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
        <a
          href={mapillaryLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-background/90 hover:bg-background text-foreground text-xs px-3 py-1.5 rounded-lg shadow-md border border-border active:scale-95 transition-transform"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Mapillary
        </a>
      </div>

      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/90 text-foreground text-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-border z-10">
        <PersonStanding className="h-3.5 w-3.5 text-primary" />
        Street View
      </div>
    </div>
  );
};

export default MapillaryStreetView;

import { PersonStanding } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface StreetViewProps {
  lat: number;
  lng: number;
  className?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCtQx-V0yQ2CDvqjL89-AX2X1u5ZOpbvzQ';

const StreetView = ({ lat, lng, className = '' }: StreetViewProps) => {
  const { t } = useTranslation();
  const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${lat},${lng}&heading=210&pitch=10&fov=90`;

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={embedUrl}
        title={t("property.streetViewTitle")}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/90 text-foreground text-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-border z-10">
        <PersonStanding className="h-3.5 w-3.5 text-primary" />
        Street View
      </div>
    </div>
  );
};

export default StreetView;

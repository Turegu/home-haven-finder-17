import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface CompanyOfficeMapProps {
  pinLocation: string | null;
  companyName: string;
}

const defaultCenter: [number, number] = [41.0082, 28.9784]; // Istanbul default

const createOfficeIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="background:#0d9488;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const CompanyOfficeMap = ({ pinLocation, companyName }: CompanyOfficeMapProps) => {
  const center = useMemo<[number, number]>(() => {
    if (!pinLocation) return defaultCenter;
    const parts = pinLocation.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return defaultCenter;
  }, [pinLocation]);

  const hasPin = pinLocation && center !== defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={hasPin ? 15 : 12}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
      style={{ minHeight: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {hasPin && (
        <Marker position={center} icon={createOfficeIcon()}>
          <Popup>
            <span className="text-sm font-semibold">{companyName}</span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default CompanyOfficeMap;

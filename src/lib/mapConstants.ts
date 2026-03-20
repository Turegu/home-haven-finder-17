// Shared Google Maps API key — single source of truth
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCtQx-V0yQ2CDvqjL89-AX2X1u5ZOpbvzQ';

// Shared city coordinate lookup for listings without pin_location
export const cityCoords: Record<string, { lat: number; lng: number }> = {
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'abu dhabi': { lat: 24.4539, lng: 54.3773 },
  'ankara': { lat: 39.9334, lng: 32.8597 },
  'sharjah': { lat: 25.3462, lng: 55.4211 },
  'antalya': { lat: 36.8969, lng: 30.7133 },
  'nevşehir': { lat: 38.6244, lng: 34.7239 },
  'gaziantep': { lat: 37.0662, lng: 37.3833 },
};

// Deterministic fallback coordinates from location string (no Math.random)
export function getCoordsFromLocation(location: string): { lat: number; lng: number } {
  const lower = location.toLowerCase();
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (lower.includes(city)) return coords;
  }
  // Deterministic hash-based fallback instead of Math.random()
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    hash = ((hash << 5) - hash + location.charCodeAt(i)) | 0;
  }
  const latOffset = ((hash & 0xffff) / 0xffff) * 2;
  const lngOffset = (((hash >> 16) & 0xffff) / 0xffff) * 4;
  return { lat: 39.0 + latOffset, lng: 32.0 + lngOffset };
}

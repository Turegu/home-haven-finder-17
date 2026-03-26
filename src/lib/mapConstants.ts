// Shared Google Maps API key — single source of truth
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Country center + zoom for map initialization
export const countryBounds: Record<string, { center: { lat: number; lng: number }; zoom: number; bounds: [[number, number], [number, number]] }> = {
  'turkey': { center: { lat: 39.0, lng: 35.0 }, zoom: 6, bounds: [[36.0, 26.0], [42.0, 45.0]] },
  'united arab emirates': { center: { lat: 24.0, lng: 54.0 }, zoom: 7, bounds: [[22.5, 51.0], [26.5, 56.5]] },
  'saudi arabia': { center: { lat: 24.0, lng: 45.0 }, zoom: 5, bounds: [[16.0, 34.5], [32.5, 56.0]] },
  'egypt': { center: { lat: 26.8, lng: 30.8 }, zoom: 6, bounds: [[22.0, 25.0], [31.5, 37.0]] },
  'qatar': { center: { lat: 25.3, lng: 51.2 }, zoom: 8, bounds: [[24.5, 50.7], [26.2, 51.7]] },
  'bahrain': { center: { lat: 26.0, lng: 50.55 }, zoom: 10, bounds: [[25.8, 50.3], [26.3, 50.8]] },
  'kuwait': { center: { lat: 29.3, lng: 47.6 }, zoom: 8, bounds: [[28.5, 46.5], [30.1, 48.5]] },
  'oman': { center: { lat: 21.5, lng: 57.0 }, zoom: 6, bounds: [[16.5, 52.0], [26.5, 60.0]] },
  'jordan': { center: { lat: 31.0, lng: 36.5 }, zoom: 7, bounds: [[29.0, 34.9], [33.4, 39.3]] },
  'lebanon': { center: { lat: 33.9, lng: 35.8 }, zoom: 8, bounds: [[33.0, 35.1], [34.7, 36.6]] },
  'iraq': { center: { lat: 33.0, lng: 44.0 }, zoom: 6, bounds: [[29.0, 38.8], [37.4, 48.6]] },
  'syria': { center: { lat: 35.0, lng: 38.0 }, zoom: 7, bounds: [[32.3, 35.7], [37.3, 42.4]] },
  'iran': { center: { lat: 32.4, lng: 53.7 }, zoom: 5, bounds: [[25.0, 44.0], [40.0, 63.3]] },
  'pakistan': { center: { lat: 30.4, lng: 69.3 }, zoom: 5, bounds: [[23.5, 60.8], [37.1, 77.8]] },
  'india': { center: { lat: 20.6, lng: 79.0 }, zoom: 5, bounds: [[6.5, 68.0], [35.5, 97.4]] },
  'germany': { center: { lat: 51.2, lng: 10.4 }, zoom: 6, bounds: [[47.3, 5.9], [55.1, 15.0]] },
  'france': { center: { lat: 46.2, lng: 2.2 }, zoom: 6, bounds: [[41.3, -5.1], [51.1, 9.6]] },
  'united kingdom': { center: { lat: 54.0, lng: -2.0 }, zoom: 6, bounds: [[49.9, -8.2], [58.7, 1.8]] },
  'united states': { center: { lat: 39.8, lng: -98.6 }, zoom: 4, bounds: [[24.4, -125.0], [49.4, -66.9]] },
  'canada': { center: { lat: 56.1, lng: -106.3 }, zoom: 4, bounds: [[41.7, -141.0], [70.0, -52.6]] },
  'russia': { center: { lat: 61.5, lng: 105.3 }, zoom: 3, bounds: [[41.2, 19.6], [81.9, 180.0]] },
  'china': { center: { lat: 35.9, lng: 104.2 }, zoom: 4, bounds: [[18.2, 73.5], [53.6, 135.0]] },
  'japan': { center: { lat: 36.2, lng: 138.3 }, zoom: 5, bounds: [[24.0, 122.9], [45.6, 153.9]] },
  'australia': { center: { lat: -25.3, lng: 133.8 }, zoom: 4, bounds: [[-44.0, 113.0], [-10.0, 154.0]] },
  'brazil': { center: { lat: -14.2, lng: -51.9 }, zoom: 4, bounds: [[-33.8, -73.9], [5.3, -34.8]] },
  'morocco': { center: { lat: 31.8, lng: -7.1 }, zoom: 6, bounds: [[27.7, -13.2], [35.9, -1.0]] },
  'tunisia': { center: { lat: 34.0, lng: 9.5 }, zoom: 7, bounds: [[30.2, 7.5], [37.5, 11.6]] },
  'algeria': { center: { lat: 28.0, lng: 1.7 }, zoom: 5, bounds: [[19.0, -8.7], [37.1, 12.0]] },
  'libya': { center: { lat: 26.3, lng: 17.2 }, zoom: 5, bounds: [[19.5, 9.4], [33.2, 25.2]] },
  'nigeria': { center: { lat: 9.1, lng: 8.7 }, zoom: 6, bounds: [[4.3, 2.7], [13.9, 14.7]] },
  'south africa': { center: { lat: -30.6, lng: 22.9 }, zoom: 5, bounds: [[-35.0, 16.5], [-22.1, 32.9]] },
  'spain': { center: { lat: 40.5, lng: -3.7 }, zoom: 6, bounds: [[36.0, -9.3], [43.8, 4.3]] },
  'italy': { center: { lat: 41.9, lng: 12.6 }, zoom: 6, bounds: [[36.6, 6.6], [47.1, 18.5]] },
  'greece': { center: { lat: 39.1, lng: 21.8 }, zoom: 6, bounds: [[34.8, 19.4], [41.7, 29.6]] },
  'cyprus': { center: { lat: 35.1, lng: 33.4 }, zoom: 9, bounds: [[34.6, 32.3], [35.7, 34.6]] },
  'malaysia': { center: { lat: 4.2, lng: 101.9 }, zoom: 6, bounds: [[0.8, 99.6], [7.4, 119.3]] },
  'singapore': { center: { lat: 1.35, lng: 103.82 }, zoom: 11, bounds: [[1.2, 103.6], [1.5, 104.0]] },
  'indonesia': { center: { lat: -0.8, lng: 113.9 }, zoom: 4, bounds: [[-11.0, 95.0], [6.1, 141.0]] },
  'thailand': { center: { lat: 15.9, lng: 100.9 }, zoom: 6, bounds: [[5.6, 97.3], [20.5, 105.6]] },
  'south korea': { center: { lat: 35.9, lng: 127.8 }, zoom: 7, bounds: [[33.1, 125.1], [38.6, 131.9]] },
  'mexico': { center: { lat: 23.6, lng: -102.6 }, zoom: 5, bounds: [[14.5, -118.4], [32.7, -86.7]] },
};

export function getCountryMapConfig(countryName: string) {
  const key = countryName.toLowerCase();
  return countryBounds[key] || { center: { lat: 39.0, lng: 35.0 }, zoom: 6, bounds: [[36.0, 26.0], [42.0, 45.0]] };
}

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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyMoreFilters } from "@/components/PropertyFiltersModal";

export interface PropertySearchParams {
  propertyPurpose: "buy" | "rent";
  province?: string;
  district?: string;
  neighborhood?: string;
  keyword?: string;
  propertyTypes?: string[];
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  rooms?: string[];
  bathrooms?: string[];
  rentDuration?: string[];
  moreFilters?: PropertyMoreFilters;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface PropertyResult {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  property_type: string;
  property_purpose: string;
  area: number | null;
  area_unit: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: string | null;
  images: string[] | null;
  status: string;
  listing_id: string;
  floor_level: string | null;
  furniture: string | null;
  property_age: string | null;
  parking_spaces: number | null;
  rent_duration: string | null;
  interior_amenities: string[] | null;
  exterior_amenities: string[] | null;
  advertising_tags: string[] | null;
  created_at: string;
  company_id: string | null;
  agent_id: string | null;
  display_on_homepage: boolean;
  property_status: string;
  pin_location: string | null;
}

export function usePropertySearch(params: PropertySearchParams) {
  return useQuery({
    queryKey: ["property-search", params],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .eq("property_purpose", params.propertyPurpose === "rent" ? "rent" : "buy");

      // Location filters
      if (params.province) query = query.eq("province", params.province);
      if (params.district) query = query.eq("town", params.district);
      if (params.neighborhood) query = query.eq("neighbourhood", params.neighborhood);

      // Keyword search on title/location
      if (params.keyword?.trim()) {
        const kw = `%${params.keyword.trim()}%`;
        query = query.or(`title.ilike.${kw},location.ilike.${kw},neighbourhood.ilike.${kw},town.ilike.${kw},province.ilike.${kw}`);
      }

      // Property types
      if (params.propertyTypes && params.propertyTypes.length > 0) {
        query = query.in("property_type", params.propertyTypes);
      }

      // Price range
      if (params.minPrice) query = query.gte("price", Number(params.minPrice));
      if (params.maxPrice) query = query.lte("price", Number(params.maxPrice));

      // Area range
      if (params.minArea) query = query.gte("area", Number(params.minArea));
      if (params.maxArea) query = query.lte("area", Number(params.maxArea));

      // Rooms
      if (params.rooms && params.rooms.length > 0) {
        query = query.in("rooms", params.rooms);
      }

      // Bathrooms
      if (params.bathrooms && params.bathrooms.length > 0) {
        query = query.in("bathrooms", params.bathrooms.map(Number));
      }

      // Rent duration
      if (params.rentDuration && params.rentDuration.length > 0) {
        query = query.in("rent_duration", params.rentDuration);
      }

      // More filters
      const mf = params.moreFilters;
      if (mf) {
        if (mf.floorLevels.length > 0) query = query.in("floor_level", mf.floorLevels);
        if (mf.furniture.length > 0) query = query.in("furniture", mf.furniture);
        if (mf.propertyAges.length > 0) query = query.in("property_age", mf.propertyAges);
        if (mf.parkingSpaces.length > 0) query = query.in("parking_spaces", mf.parkingSpaces.map(Number));
        if (mf.interiorAmenities.length > 0) {
          query = query.overlaps("interior_amenities", mf.interiorAmenities);
        }
        if (mf.exteriorAmenities.length > 0) {
          query = query.overlaps("exterior_amenities", mf.exteriorAmenities);
        }
      }

      // Sorting
      switch (params.sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true, nullsFirst: false });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false, nullsFirst: false });
          break;
        case "area_desc":
          query = query.order("area", { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const page = params.page || 1;
      const size = params.pageSize || 21;
      const from = (page - 1) * size;
      const to = from + size - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        properties: (data ?? []) as PropertyResult[],
        total: count ?? 0,
      };
    },
    staleTime: 60 * 1000, // 1 min
  });
}

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
  property_classification: string | null;
  created_at: string;
  company_id: string | null;
  agent_id: string | null;
  display_on_homepage: boolean;
  property_status: string;
  pin_location: string | null;
  agents?: {
    name: string;
    avatar_url: string | null;
    phone: string | null;
    whatsapp: string | null;
  } | null;
  companies?: {
    name: string;
    logo_url: string | null;
    phone: string | null;
    whatsapp: string | null;
  } | null;
}

export function usePropertySearch(params: PropertySearchParams) {
  return useQuery({
    queryKey: ["property-search", params],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*, agents(name, avatar_url, phone, whatsapp), companies(name, logo_url, phone, whatsapp)", { count: "exact" })
        .eq("status", "active")
        .eq("property_purpose", params.propertyPurpose === "rent" ? "rent" : "buy");

      // Location filters
      if (params.province) query = query.eq("province", params.province);
      if (params.district) query = query.eq("town", params.district);
      if (params.neighborhood) query = query.eq("neighbourhood", params.neighborhood);

      // Keyword search — accent-insensitive via DB function
      let keywordIdOrder: Map<string, number> | null = null;
      if (params.keyword?.trim()) {
        const { data: matchIds } = await supabase.rpc("search_property_ids_by_keyword", {
          p_keyword: params.keyword.trim(),
        });
        if (matchIds && matchIds.length > 0) {
          const orderedIds = [...matchIds]
            .sort((a: { rank: number }, b: { rank: number }) => b.rank - a.rank)
            .map((r: { property_id: string }) => r.property_id);
          query = query.in("id", orderedIds);
          keywordIdOrder = new Map(orderedIds.map((id: string, i: number) => [id, i]));
        } else {
          // No matches — return empty
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
        }
      }

      // Property types
      if (params.propertyTypes && params.propertyTypes.length > 0) {
        query = query.in("property_type", params.propertyTypes.map(t => t.toLowerCase()));
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
        if (mf.floorLevels.length > 0) query = query.in("floor_level", mf.floorLevels.map(v => v.toLowerCase()));
        if (mf.furniture.length > 0) query = query.in("furniture", mf.furniture.map(v => v.toLowerCase()));
        if (mf.propertyAges.length > 0) query = query.in("property_age", mf.propertyAges.map(v => v.toLowerCase()));
        if (mf.parkingSpaces.length > 0) query = query.in("parking_spaces", mf.parkingSpaces.map(Number));
        if (mf.interiorAmenities.length > 0) {
          query = query.overlaps("interior_amenities", mf.interiorAmenities);
        }
        if (mf.exteriorAmenities.length > 0) {
          query = query.overlaps("exterior_amenities", mf.exteriorAmenities);
        }
      }

      // Sorting: when user picks a specific sort (price/area), it takes priority.
      // Tier ordering (premium > featured > standard) is secondary.
      // For default sort ("newest"), tier ordering is primary.
      const isDefaultSort = !params.sortBy || params.sortBy === 'newest';

      if (isDefaultSort) {
        query = query.order("display_on_homepage", { ascending: false });
        query = query.order("created_at", { ascending: false });
      } else {
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
          case "area_asc":
            query = query.order("area", { ascending: true, nullsFirst: false });
            break;
        }
        query = query.order("display_on_homepage", { ascending: false });
      }

      // Pagination
      const page = params.page || 1;
      const size = params.pageSize || 21;
      const from = (page - 1) * size;
      const to = from + size - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const tierOrder = (cls: string | null) => {
        if (cls === "premium") return 0;
        if (cls === "featured") return 1;
        return 2;
      };

      // Only apply client-side tier re-sort for default sort
      let sorted = data ?? [];
      if (isDefaultSort) {
        sorted = [...sorted].sort((a: any, b: any) => {
          return tierOrder(a.property_classification) - tierOrder(b.property_classification);
        });
      }

      return {
        properties: sorted as PropertyResult[],
        total: count ?? 0,
      };
    },
    staleTime: 60 * 1000, // 1 min
  });
}

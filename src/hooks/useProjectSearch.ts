import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectSearchParams {
  province?: string;
  district?: string;
  neighborhood?: string;
  keyword?: string;
  unitTypes?: string[];
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  rooms?: string[];
  projectStatus?: string;
  amenities?: string[];
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectResult {
  id: string;
  title: string;
  tagline: string | null;
  project_type: string;
  project_status: string;
  min_price: number | null;
  max_price: number | null;
  currency: string | null;
  min_area: number | null;
  max_area: number | null;
  area_unit: string | null;
  min_units: number | null;
  max_units: number | null;
  developer: string | null;
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  location: string | null;
  description: string | null;
  images: string[] | null;
  logo_url: string | null;
  interior_amenities: string[] | null;
  exterior_amenities: string[] | null;
  company_id: string | null;
  status: string;
  listing_id: string;
  display_on_homepage: boolean;
  completion_date: string | null;
  created_at: string;
  pin_location: string | null;
}

export function useProjectSearch(params: ProjectSearchParams) {
  return useQuery({
    queryKey: ["project-search", params],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*", { count: "exact" })
        .eq("status", "active");

      if (params.province) query = query.eq("province", params.province);
      if (params.district) query = query.eq("town", params.district);
      if (params.neighborhood) query = query.eq("neighbourhood", params.neighborhood);

      if (params.keyword?.trim()) {
        const kw = `%${params.keyword.trim()}%`;
        query = query.or(`title.ilike.${kw},location.ilike.${kw},developer.ilike.${kw},neighbourhood.ilike.${kw},town.ilike.${kw},province.ilike.${kw}`);
      }

      if (params.minPrice) query = query.gte("min_price", Number(params.minPrice));
      if (params.maxPrice) query = query.lte("max_price", Number(params.maxPrice));
      if (params.minArea) query = query.gte("min_area", Number(params.minArea));
      if (params.maxArea) query = query.lte("max_area", Number(params.maxArea));

      if (params.amenities && params.amenities.length > 0) {
        query = query.overlaps("exterior_amenities", params.amenities);
      }

      // Sorting
      switch (params.sortBy) {
        case "price_asc":
          query = query.order("min_price", { ascending: true, nullsFirst: false });
          break;
        case "price_desc":
          query = query.order("min_price", { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const page = params.page || 1;
      const size = params.pageSize || 21;
      const from = (page - 1) * size;
      query = query.range(from, from + size - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        projects: (data ?? []) as ProjectResult[],
        total: count ?? 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

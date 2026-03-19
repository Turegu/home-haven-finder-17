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
      const page = params.page || 1;
      const size = params.pageSize || 21;
      const offset = (page - 1) * size;

      const { data, error } = await supabase.rpc("search_projects_by_units", {
        p_province: params.province || null,
        p_district: params.district || null,
        p_neighborhood: params.neighborhood || null,
        p_keyword: params.keyword?.trim() || null,
        p_unit_types: params.unitTypes && params.unitTypes.length > 0 ? params.unitTypes : null,
        p_min_price: params.minPrice ? Number(params.minPrice) : null,
        p_max_price: params.maxPrice ? Number(params.maxPrice) : null,
        p_min_area: params.minArea ? Number(params.minArea) : null,
        p_max_area: params.maxArea ? Number(params.maxArea) : null,
        p_rooms: params.rooms && params.rooms.length > 0 ? params.rooms : null,
        p_project_status: params.projectStatus || null,
        p_amenities: params.amenities && params.amenities.length > 0 ? params.amenities : null,
        p_sort_by: params.sortBy || "newest",
        p_offset: offset,
        p_limit: size,
      });

      if (error) throw error;

      const rows = (data ?? []) as { project_row: any; total_count: number }[];
      const total = rows.length > 0 ? rows[0].total_count : 0;
      const projects = rows.map((r) => r.project_row as ProjectResult);

      return { projects, total };
    },
    staleTime: 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Languages ───
interface Language { id: string; name: string; code: string }

export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("id, name, code")
        .eq("status", "active")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Language[];
    },
    staleTime: 30 * 60 * 1000, // 30 min — rarely changes
  });
}

// ─── Currencies ───
interface Currency { id: string; name: string; code: string; symbol: string }

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("currencies")
        .select("id, name, code, symbol")
        .eq("status", "active")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Currency[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Filter categories + options ───
interface FilterCategory {
  id: string;
  category_key: string;
  title: string;
  applies_to: string[];
}

interface FilterOption {
  id: string;
  category_id: string;
  title: string;
}

export function useFilterCategories(context: string) {
  return useQuery({
    queryKey: ["filter-categories", context],
    queryFn: async () => {
      const { data: cats, error: catErr } = await supabase
        .from("filter_categories")
        .select("id, category_key, title, applies_to")
        .eq("status", "active")
        .order("sort_order");
      if (catErr) throw catErr;

      const relevantCats = (cats ?? []).filter(
        (c) => (c.applies_to as string[]).includes(context) || (c.applies_to as string[]).includes("search")
      );

      const catIds = relevantCats.map((c) => c.id);
      let optionsByCategory: Record<string, FilterOption[]> = {};

      if (catIds.length > 0) {
        const { data: opts, error: optErr } = await supabase
          .from("filter_options")
          .select("id, category_id, title")
          .in("category_id", catIds)
          .eq("status", "active")
          .order("sort_order");
        if (optErr) throw optErr;

        for (const opt of opts ?? []) {
          if (!optionsByCategory[opt.category_id]) optionsByCategory[opt.category_id] = [];
          optionsByCategory[opt.category_id].push(opt);
        }
      }

      return { categories: relevantCats as FilterCategory[], optionsByCategory };
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

// ─── CMS page content ───
export function useCmsPage<T = Record<string, any>>(slug: string) {
  return useQuery({
    queryKey: ["cms-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("content")
        .eq("page_slug", slug)
        .limit(1);
      if (error) throw error;
      return (data?.[0] as any)?.content as T | undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Featured locations ───
interface FeaturedLocation { id: string; name: string; image_url: string | null; link_url: string | null; tagline: string | null }

export function useFeaturedLocations() {
  return useQuery({
    queryKey: ["featured-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_locations")
        .select("*")
        .eq("status", "active")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as FeaturedLocation[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Partners ───
interface Partner { id: string; name: string; logo_url: string | null; link_url: string | null }

export function usePartners() {
  return useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("status", "active")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Partner[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

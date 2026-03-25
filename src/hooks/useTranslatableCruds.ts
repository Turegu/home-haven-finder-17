import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DbTranslatableItem {
  id: string;
  title: string;
  translations: Record<string, string>;
  sort_order: number;
  status: string;
}

// Shared fetcher for designations & company_types tables
async function fetchTranslatableItems(table: "designations" | "company_types"): Promise<DbTranslatableItem[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("status", "active")
    .order("sort_order");
  if (error) throw error;
  return (data || []) as unknown as DbTranslatableItem[];
}

export function useDesignations() {
  return useQuery({
    queryKey: ["designations"],
    queryFn: () => fetchTranslatableItems("designations"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyTypes() {
  return useQuery({
    queryKey: ["company_types"],
    queryFn: () => fetchTranslatableItems("company_types"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Get localized label for a translatable item */
export function getTranslatedLabel(
  items: DbTranslatableItem[],
  value: string | null | undefined,
  lang: string
): string {
  if (!value) return "";
  const found = items.find(i => i.title === value);
  if (!found) return value;
  if (lang !== "en" && found.translations[lang]) return found.translations[lang];
  return found.title;
}

/** Format company types array to display string */
export function formatCompanyTypesFromDb(
  items: DbTranslatableItem[],
  types: string[] | null,
  lang: string
): string {
  if (!types || types.length === 0) {
    // Default fallback
    const defaultItem = items[0];
    if (defaultItem) return getTranslatedLabel(items, defaultItem.title, lang);
    return "Real Estate Company";
  }
  return types
    .map(t => getTranslatedLabel(items, t, lang))
    .filter(Boolean)
    .join(", ");
}
